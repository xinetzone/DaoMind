# 复盘报告 · P8 道象 · 对话可视化（思维导图）
> 版本 v2.38.0 · 2026-04-17

## 一、任务目标

在道衍 AI 对话界面中，为当前会话生成**思维导图**，将对话内容的核心主题以 SVG 横向树的形式直观呈现。无需额外依赖库，纯代码实现布局与渲染。

---

## 二、实现架构

```
ChatPage [Network 按钮]
    ↓ handleMindMap()
useMindMap.generate(messages)
    ↓ POST /functions/v1/dao-mindmap
dao-mindmap Edge Function
    ↓ GLM-5 非流式调用 (AI_API_TOKEN_8c107efce1b0)
返回 JSON MindNode 树
    ↓
MindMapModal — SVG 横向树渲染
```

---

## 三、文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `supabase/functions/dao-mindmap/index.ts` | 新建 | Deno Edge Function，调用 GLM-5 提取主题 |
| `src/hooks/useMindMap.ts` | 新建 | fetch hook，管理 tree/loading/error 状态 |
| `src/components/MindMapModal.tsx` | 新建 | Modal + 纯 SVG 树渲染（210 行） |
| `src/pages/ChatPage.tsx` | 修改 | 添加 Network 按钮、showMindMap 状态、MindMapModal |
| `src/index.css` | 修改 | 追加 `.mindmap-*` CSS 约 70 行 |

---

## 四、算法设计

### SVG 横向树布局（纯计算，无依赖）

```typescript
function countLeaves(node): number   // 递归计算叶节点数
function layoutTree(root): LayoutResult  // 基于叶节点分配 Y 坐标
// x = depth * (NODE_W + H_GAP) + 20
// cy = yOffset + blockH / 2
// Bezier: M x1,y1 C mx,y1 mx,y2 x2,y2
```

颜色按深度：`primary → secondary → text-muted → border-strong`

---

## 五、AI 提示词设计

```
请从以下对话中提取核心主题和子主题，生成思维导图结构。
严格返回JSON格式，不要任何解释文字。
格式: {"text":"根主题","children":[{"text":"子主题","children":[]}]}
要求: 根主题为对话核心(10字内)，最多3层，每层最多5节点，节点文字简短(8字内)。仅返回纯JSON。
```

`validateTree()` 函数在前端二次校验 JSON 结构（最多 3 层 / 每层 5 节点 / 文字 20 字截断）。

---

## 六、测试检查点

- [ ] 有消息时顶部显示「导图」按钮
- [ ] 点击按钮弹出 Modal，显示 Loader 动画
- [ ] AI 返回后渲染 SVG 树（横向 Bezier 曲线连接）
- [ ] 点击蒙层或 X 关闭 Modal
- [ ] 空消息列表时按钮不可见
- [ ] 错误时显示错误提示文字

---

## 七、问题与解决

| 问题 | 解决 |
|------|------|
| Edge Function 首次部署失败 | 第二次重试成功（code: 1000 网络抖动） |
| AI 返回 JSON 可能被 markdown 代码块包裹 | `rawText.match(/\{[\s\S]*\}/)` 正则提取 |
| SVG 宽高动态计算 | `countLeaves` × `(NODE_H + V_GAP)` 计算总高 |

---

## 八、版本

- Tag: `v2.38.0`
- Commit: `cf190bf`
- Branch: main
