# 第 01 集：10分钟快速入门

> 📹 **时长**: 10分钟  
> 🎯 **难度**: ⭐ 入门  
> 👥 **目标受众**: 完全新手  
> 📚 **前置知识**: Node.js 和 TypeScript 基础

---

## 📋 学习目标

完成本集学习后，你将能够：
- ✅ 理解 DaoMind 是什么以及为什么需要它
- ✅ 搭建开发环境并安装依赖
- ✅ 创建并运行第一个 Hello World 程序
- ✅ 理解"无名"与"有名"的基本概念

---

## 🎬 视频大纲

```
00:00 - 🎯 开场与课程介绍
01:00 - 💡 什么是 DaoMind？
02:30 - ⚙️  环境搭建
04:00 - 👨‍💻 编写第一个示例
06:00 - 🧠 核心概念解释
08:00 - ▶️  运行和测试
09:30 - 🚀 下一步学习指引
10:00 - 📝 小结与作业
```

---

## 💬 详细脚本

### 00:00 - 开场介绍 (1分钟)

**[画面]**: DaoMind Logo + 标题动画

**[旁白]**:
"欢迎来到 DaoMind & Modulux 视频教程系列！我是你的讲师 [名字]。

在接下来的 10 分钟里，我将带你快速入门 DaoMind —— 一个融合了东方哲学智慧与现代 TypeScript 技术的模块化框架。

这个框架有什么特别之处呢？它基于道家思想中'无名，万物之始；有名，万物之母'的理念，将类型系统与值系统巧妙地映射到哲学概念上。

听起来很抽象？别担心，今天我们会用最简单的方式，让你在 10 分钟内写出第一个 DaoMind 程序。

准备好了吗？让我们开始吧！"

**[字幕提示]**:
- 订阅频道获取更多教程
- 源代码：github.com/xinetzone/DaoMind

---

### 01:00 - 什么是 DaoMind？(1分30秒)

**[画面]**: 切换到 PPT/图表

**[旁白]**:
"首先，DaoMind 是什么？

【显示图表：DaoMind = 哲学 + TypeScript】

简单来说，DaoMind 是一个 TypeScript 模块化框架，但它不仅仅是另一个框架。它的独特之处在于：

第一，它有坚实的哲学基础。基于帛书《道德经》中的'无名'与'有名'概念，DaoMind 将类型定义（无名）与运行时实例（有名）进行了清晰的区分。

【动画：'无名' → 类型空间，'有名' → 值空间】

第二，它追求零运行时开销。所有的类型定义在编译后完全消失，不会增加任何运行时负担。

【代码对比：编译前 vs 编译后】

第三，它提供了完整的模块化生态。从基础的存在性契约，到模块管理、Agent 系统、消息总线，一应俱全。

【显示包结构图】

听起来很酷，对吧？现在让我们动手实践！"

**[屏幕提示]**:
- @daomind/nothing - 类型定义
- @daomind/anything - 模块系统
- @daomind/agents - Agent 系统

---

### 02:30 - 环境搭建 (1分30秒)

**[画面]**: 切换到终端

**[旁白]**:
"开始之前，确保你已经安装了 Node.js 18+ 和 pnpm。如果还没有，可以暂停视频去安装。

【显示命令】
```bash
node --version  # 应该是 18.0.0 或更高
pnpm --version  # 应该是 8.0.0 或更高
```

好的，现在让我们创建一个新项目。我会在终端里创建一个文件夹，然后初始化 TypeScript 项目：

【实时敲命令】
```bash
mkdir daomind-hello
cd daomind-hello
pnpm init
```

接下来安装 DaoMind 的核心包：

```bash
pnpm add @daomind/nothing
pnpm add -D typescript tsx @types/node
```

初始化 TypeScript 配置：

```bash
pnpx tsc --init
```

现在我们有了一个基本的项目结构。让我们打开 VS Code 开始编码！

```bash
code .
```

**[字幕]**: 
- 完整安装指南：docs/GETTING-STARTED.md

---

### 04:00 - 编写第一个示例 (2分钟)

**[画面]**: VS Code 全屏

**[旁白]**:
"好的，现在我们在 VS Code 里了。让我创建两个文件：

首先是 `types.ts`，用于定义类型（'无名'层）：

【边说边敲代码，保持节奏感】

```typescript
// types.ts - 类型定义（无名层）
import type { ExistenceContract } from '@daomind/nothing';

export interface HelloModule extends ExistenceContract {
  readonly message: string;
  readonly language: string;
}
```

看，这就是一个类型定义。它继承了 `ExistenceContract`，这是 DaoMind 中最基础的契约。

注意这里的关键词 `type`，这确保我们只导入类型，编译后会完全消失。

接下来创建 `index.ts`，用于创建实例（'有名'层）：

```typescript
// index.ts - 实例创建（有名层）
import type { HelloModule } from './types';

// 创建函数 - 从'无名'到'有名'的转化
function createHello(
  message: string, 
  language = 'en'
): HelloModule {
  return {
    existentialType: 'anything',  // 标记为'有名'状态
    message,
    language,
  };
}

// 使用
const hello = createHello('Hello, DaoMind!', 'en');
console.log('✨', hello.message);
console.log('📦 存在性类型:', hello.existentialType);
```

就这么简单！我们定义了一个类型，然后创建了一个实例。"

**[字幕]**: 
- type 导入 = 零运行时
- existentialType = '无名' | '有名'

---

### 06:00 - 核心概念解释 (2分钟)

**[画面]**: 分屏 - 左边代码，右边图解

**[旁白]**:
"现在让我解释一下刚才我们做了什么。这里有三个核心概念：

【图解出现】

第一，'无名'与'有名'。

'无名'指的是类型定义，就像我们的 `HelloModule` 接口。它只存在于编译时，描述了事物应该是什么样子。就像道德经说的'无名，万物之始'—— 没有名字，但是万物的起源。

'有名'指的是实际的实例，就像我们创建的 `hello` 对象。它在运行时真实存在，有具体的值。'有名，万物之母' —— 有了名字，成为具体的事物。

【动画演示类型 → 实例的过程】

第二，`ExistenceContract`。

这是所有 DaoMind 实体的基础契约，它只有一个属性：`existentialType`。这个属性标记实体的存在状态：
- `'nothing'` = 处于'无名'状态
- `'anything'` = 处于'有名'状态

第三，零运行时设计。

看这里【显示编译后的代码】，我们使用 `type` 导入，所以 TypeScript 编译后，所有类型定义都消失了，只剩下实际的逻辑代码。这就是零运行时 —— 类型检查的好处，却没有性能开销。"

**[动画]**: 
- 编译前代码 (带类型) → 编译后代码 (纯 JS)

---

### 08:00 - 运行和测试 (1分30秒)

**[画面]**: 回到终端

**[旁白]**:
"理论讲完了，让我们运行代码看看效果！

在 package.json 里添加一个脚本：

```json
{
  "scripts": {
    "dev": "tsx index.ts"
  }
}
```

现在运行它：

```bash
pnpm dev
```

【显示输出】
```
✨ Hello, DaoMind!
📦 存在性类型: anything
```

完美！我们的第一个 DaoMind 程序成功运行了！

让我们再试试多语言版本：

【修改代码】
```typescript
const greetings = [
  createHello('Hello, DaoMind!', 'en'),
  createHello('你好，道心！', 'zh'),
  createHello('こんにちは、DaoMind！', 'ja'),
];

greetings.forEach(g => {
  console.log(`[${g.language}]`, g.message);
});
```

【运行】
```bash
pnpm dev
```

【显示输出】
```
[en] Hello, DaoMind!
[zh] 你好，道心！
[ja] こんにちは、DaoMind！
```

太棒了！"

**[屏幕录制]**: 实时编码和运行过程

---

### 09:30 - 下一步学习指引 (30秒)

**[画面]**: 回到PPT

**[旁白]**:
"恭喜你完成了第一个 DaoMind 程序！

接下来你可以：

1. 观看第 2 集，深入理解'无名'与'有名'的哲学
2. 查看 docs/GETTING-STARTED.md 获取更多示例
3. 尝试 01-hello-world 完整项目
4. 加入我们的 GitHub Discussions 讨论

记住，学习的最好方式就是动手实践。试着修改代码，添加新的属性，看看会发生什么！"

**[字幕]**:
- 📺 下一集：理解"无名"与"有名"
- 📚 完整文档：docs/
- 💬 社区：GitHub Discussions

---

### 10:00 - 小结与作业 (30秒)

**[画面]**: 总结幻灯片

**[旁白]**:
"让我们快速回顾一下今天学到的内容：

✅ DaoMind 是融合哲学与技术的模块化框架
✅ '无名'代表类型定义，'有名'代表运行时实例
✅ ExistenceContract 是所有实体的基础契约
✅ 使用 type 导入实现零运行时

【作业】
今天的作业是：
1. 为 HelloModule 添加一个 `createdAt` 时间戳
2. 创建一个格式化函数 `formatHello()`
3. 在评论区分享你的代码

感谢观看！别忘了点赞、订阅和分享。下集见！"

**[结束画面]**: 
- 点赞、订阅、评论
- GitHub: github.com/xinetzone/DaoMind
- 下集预告缩略图

---

## 📊 视觉素材清单

### 需要准备的素材

1. **开场动画**
   - DaoMind Logo
   - 标题卡片
   - 订阅提示

2. **概念图解**
   - 哲学 + TypeScript 图表
   - '无名' vs '有名' 对比图
   - 编译前后代码对比
   - 包结构图

3. **代码演示**
   - 终端操作录屏
   - VS Code 编码过程
   - 代码高亮和注释

4. **动画效果**
   - 类型到实例的转化动画
   - 编译过程动画
   - 概念连接线动画

### 屏幕录制设置

- **分辨率**: 1920x1080
- **VS Code 主题**: One Dark Pro
- **字体**: Fira Code, 16-18pt
- **终端**: iTerm2 / Windows Terminal
- **放大**: 适当放大代码区域

---

## 🎤 录制技巧

### 语速和节奏
- 保持语速适中（150-180字/分钟）
- 关键概念处放慢节奏
- 代码演示时同步解说

### 语气和情感
- 开场热情饱满
- 讲解清晰友好
- 鼓励和激励学习者

### 常见问题处理
- 如果口误，重录该段
- 保持环境安静
- 准备好饮用水

---

## ✅ 制作检查清单

录制前：
- [ ] 测试所有代码示例
- [ ] 准备好所有图表和动画
- [ ] 检查麦克风和录屏软件
- [ ] 关闭系统通知
- [ ] 准备脚本提词器

录制中：
- [ ] 保持语速稳定
- [ ] 及时切换画面
- [ ] 注意时间控制

后期制作：
- [ ] 添加字幕（中英双语）
- [ ] 插入图表动画
- [ ] 添加背景音乐（可选）
- [ ] 制作缩略图
- [ ] 添加章节标记

---

## 📈 发布清单

- [ ] YouTube 上传（标题、描述、标签）
- [ ] Bilibili 上传（中文字幕）
- [ ] 添加到播放列表
- [ ] GitHub 更新视频链接
- [ ] 社交媒体宣传
- [ ] 社区公告

---

**脚本版本**: 1.0  
**最后更新**: 2026-04-15  
**预估实际时长**: 10-11分钟  
**建议重录次数**: 2-3次达到最佳效果
