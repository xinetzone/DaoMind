# DaoMind & Modulux - 部署上线指南

> 📅 **创建日期**: 2026-04-15  
> 🎯 **目标**: 将 DaoMind 项目正式部署上线  
> ⏱️ **预计时间**: 15-30 分钟  
> 📦 **包含**: GitHub Pages 部署 + npm 包发布

---

## 📋 部署前检查清单

### 1. 代码准备 ✅
- [x] CLI 工具完成 (create-daomind)
- [x] 文档站点完成 (VitePress)
- [x] GitHub Actions 工作流配置
- [x] 所有更改已提交并推送
- [x] 本地构建测试通过

### 2. 账户准备
- [ ] GitHub 仓库管理员权限
- [ ] npm 账户（用于发布 CLI 工具）

---

## 🌐 步骤 1: 部署文档站点到 GitHub Pages

### 1.1 启用 GitHub Pages

1. **访问 GitHub 仓库设置**
   ```
   https://github.com/xinetzone/DaoMind/settings/pages
   ```

2. **配置 GitHub Pages**
   - 找到 "Build and deployment" 部分
   - **Source**: 选择 "GitHub Actions"
   - 点击 "Save"（如果有保存按钮）

3. **触发部署**
   
   部署会在以下情况自动触发：
   - Push 到 `enter-main` 分支
   - 修改 `docs/site/**` 目录下的文件
   - 手动触发（在 Actions 页面）

   **手动触发部署**：
   ```
   1. 访问 https://github.com/xinetzone/DaoMind/actions
   2. 点击 "Deploy Documentation Site" 工作流
   3. 点击 "Run workflow" 按钮
   4. 选择 "enter-main" 分支
   5. 点击绿色的 "Run workflow" 按钮
   ```

### 1.2 验证部署

1. **查看部署状态**
   ```
   https://github.com/xinetzone/DaoMind/actions
   ```
   
   - 等待绿色的 ✅ 标记（通常 2-3 分钟）
   - 如果出现红色 ❌，点击查看日志

2. **访问文档站点**
   ```
   https://xinetzone.github.io/DaoMind/
   ```
   
   预期看到：
   - ✅ DaoMind & Modulux 首页
   - ✅ AI 生成的 Logo
   - ✅ 哲学驱动的配色方案
   - ✅ 导航和侧边栏正常工作
   - ✅ 暗色/亮色模式切换

### 1.3 故障排除

**问题 1: Actions 页面没有工作流**
- 原因: GitHub Actions 可能未启用
- 解决: 访问 `https://github.com/xinetzone/DaoMind/settings/actions`
- 确保 "Allow all actions and reusable workflows" 已选中

**问题 2: 构建失败 - 找不到 vitepress**
- 原因: 依赖未正确安装
- 解决: 工作流会自动安装依赖，检查 pnpm 版本

**问题 3: 404 Not Found**
- 原因: Pages 未正确配置或需要等待
- 解决: 等待 5-10 分钟，GitHub Pages 首次部署可能需要时间

---

## 📦 步骤 2: 发布 CLI 工具到 npm

### 2.1 准备 npm 账户

1. **注册 npm 账户**（如果还没有）
   ```
   https://www.npmjs.com/signup
   ```

2. **登录 npm**
   ```bash
   npm login
   ```
   
   需要输入：
   - Username（用户名）
   - Password（密码）
   - Email（邮箱）
   - OTP（如果启用了 2FA）

3. **验证登录**
   ```bash
   npm whoami
   ```
   
   应该显示您的 npm 用户名

### 2.2 发布前测试

1. **本地构建测试**
   ```bash
   cd packages/create-daomind
   pnpm build
   ```
   
   预期输出：
   - ✅ TypeScript 编译成功
   - ✅ `dist/index.js` 文件已生成

2. **本地测试 CLI**
   ```bash
   # 在项目根目录
   cd /tmp
   node /workspace/thread/packages/create-daomind/dist/index.js my-test-project
   ```
   
   预期行为：
   - ✅ 显示交互式提示
   - ✅ 可以选择模板
   - ✅ 项目创建成功

3. **检查包内容**
   ```bash
   cd packages/create-daomind
   pnpm pack --dry-run
   ```
   
   确认包含：
   - ✅ `dist/` 目录
   - ✅ `templates/` 目录（4 个模板）
   - ✅ `package.json`
   - ✅ `README.md`
   - ✅ `CHANGELOG.md`

### 2.3 发布到 npm

1. **检查包名是否可用**
   ```bash
   npm view create-daomind
   ```
   
   - 如果显示 404: 包名可用 ✅
   - 如果显示包信息: 包名已被占用 ❌（需要更改名称）

2. **发布包**
   ```bash
   cd packages/create-daomind
   pnpm publish --access public
   ```
   
   **注意事项**：
   - 首次发布需要 `--access public`（因为是 scoped package）
   - 发布后无法删除，只能 deprecate
   - 建议先发布 `2.0.0-beta.1` 测试版本

3. **验证发布**
   ```bash
   # 等待 1-2 分钟后
   npm view create-daomind
   
   # 测试安装
   cd /tmp
   pnpm create daomind my-new-project
   ```

### 2.4 发布后步骤

1. **添加 npm badge 到 README**
   ```markdown
   [![npm version](https://badge.fury.io/js/create-daomind.svg)](https://www.npmjs.com/package/create-daomind)
   [![npm downloads](https://img.shields.io/npm/dm/create-daomind.svg)](https://www.npmjs.com/package/create-daomind)
   ```

2. **更新文档**
   - 在文档站点添加安装指南
   - 更新主 README.md

3. **创建 Git tag**
   ```bash
   git tag -a create-daomind-v2.0.0 -m "Release create-daomind v2.0.0"
   git push github --tags
   ```

---

## 🎯 步骤 3: 验证部署

### 3.1 文档站点验证

访问 https://xinetzone.github.io/DaoMind/ 并检查：

- [ ] 首页正常显示
- [ ] Logo 显示正确
- [ ] 导航菜单工作正常
- [ ] 搜索功能可用
- [ ] 暗色/亮色模式切换正常
- [ ] 所有页面链接有效
- [ ] 移动端响应式正常
- [ ] 代码高亮显示正确

### 3.2 CLI 工具验证

运行以下命令测试：

```bash
# 测试 pnpm
pnpm create daomind test-project-pnpm

# 测试 npm
npm create daomind@latest test-project-npm

# 测试 yarn
yarn create daomind test-project-yarn
```

验证清单：
- [ ] 交互式提示正常显示
- [ ] 可以选择不同模板
- [ ] 项目创建成功
- [ ] 依赖自动安装
- [ ] README 文件正确
- [ ] 示例代码可运行

### 3.3 集成测试

创建一个新项目并运行：

```bash
# 使用 CLI 创建项目
pnpm create daomind my-integration-test

# 进入项目
cd my-integration-test

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行
pnpm start
```

预期结果：
- ✅ 项目创建成功
- ✅ 依赖安装成功
- ✅ TypeScript 编译通过
- ✅ 程序正常运行

---

## 📊 部署后监控

### 1. GitHub Pages 监控

**访问量统计**（如果启用了）：
```
https://github.com/xinetzone/DaoMind/graphs/traffic
```

**部署历史**：
```
https://github.com/xinetzone/DaoMind/actions
```

### 2. npm 包监控

**npm 统计页面**：
```
https://www.npmjs.com/package/create-daomind
```

监控指标：
- Weekly downloads（周下载量）
- Total downloads（总下载量）
- Dependents（依赖此包的项目数）

**使用 npm-stat 查看详细统计**：
```bash
npx npm-stat create-daomind
```

### 3. 错误监控

**GitHub Issues**：
```
https://github.com/xinetzone/DaoMind/issues
```

关注：
- 用户报告的 bug
- 功能请求
- 文档问题

---

## 🚀 部署成功后的推广

### 1. 社交媒体推广

发布消息模板：

```markdown
🎉 DaoMind & Modulux 正式发布！

受道家哲学启发的模块化 TypeScript 框架
- ✅ 零运行时开销
- ✅ 完整的类型安全
- ✅ 4 个即用模板
- ✅ 一键项目创建

快速开始：
pnpm create daomind my-project

文档：https://xinetzone.github.io/DaoMind/
GitHub：https://github.com/xinetzone/DaoMind

#TypeScript #Framework #OpenSource #DaoMind
```

### 2. 开发者社区

推荐发布到：
- [ ] Reddit - r/typescript, r/javascript
- [ ] Hacker News
- [ ] Dev.to
- [ ] 掘金（中文社区）
- [ ] SegmentFault（中文社区）
- [ ] Twitter/X
- [ ] Discord TypeScript 社区

### 3. 技术博客

撰写博客主题：
- "为什么我们用道家哲学设计 TypeScript 框架"
- "零运行时 TypeScript 框架的设计实践"
- "create-daomind: 一键创建模块化项目"

---

## 📝 部署检查清单

### 上线前
- [x] 代码构建测试通过
- [x] 文档站点本地预览正常
- [x] CLI 工具本地测试通过
- [x] 所有更改已提交推送
- [ ] GitHub Pages 已启用
- [ ] npm 账户已登录

### 上线中
- [ ] GitHub Pages 部署成功
- [ ] 文档站点可访问
- [ ] CLI 工具发布到 npm
- [ ] npm 包可正常安装

### 上线后
- [ ] 部署验证完成
- [ ] 监控配置完成
- [ ] README 更新完成
- [ ] 推广消息发布

---

## 🔧 快速命令参考

### GitHub Pages 部署
```bash
# 手动触发部署（在 GitHub Actions 页面操作）
# 或者推送更改自动触发
git push github main:enter-main
```

### npm 发布
```bash
# 登录 npm
npm login

# 发布包
cd packages/create-daomind
pnpm build
pnpm publish --access public

# 验证
npm view create-daomind
pnpm create daomind test-project
```

### 本地测试
```bash
# 测试文档站点
cd docs/site
pnpm dev     # 开发服务器
pnpm build   # 生产构建

# 测试 CLI 工具
cd packages/create-daomind
pnpm build
node dist/index.js my-test
```

---

## 🆘 常见问题

### Q1: GitHub Pages 显示 404
**A**: 等待 5-10 分钟，首次部署需要时间。检查 Actions 是否成功。

### Q2: npm 发布失败 - 需要登录
**A**: 运行 `npm login` 并输入凭据。

### Q3: npm 发布失败 - 包名已存在
**A**: 更改 package.json 中的包名，或使用 scoped package（如 `@username/create-daomind`）。

### Q4: CLI 创建项目失败
**A**: 检查模板目录是否包含在发布的包中。运行 `npm pack --dry-run` 查看包内容。

### Q5: 文档站点样式错误
**A**: 检查 base URL 配置。如果仓库名不是根域名，需要在 config.ts 中设置 `base: '/DaoMind/'`。

---

## 🔗 重要链接

### GitHub
- **仓库**: https://github.com/xinetzone/DaoMind
- **Actions**: https://github.com/xinetzone/DaoMind/actions
- **Pages 设置**: https://github.com/xinetzone/DaoMind/settings/pages
- **Issues**: https://github.com/xinetzone/DaoMind/issues

### 文档站点
- **URL**: https://xinetzone.github.io/DaoMind/
- **源码**: https://github.com/xinetzone/DaoMind/tree/enter-main/docs/site

### npm
- **包页面**: https://www.npmjs.com/package/create-daomind（发布后）
- **CLI 源码**: https://github.com/xinetzone/DaoMind/tree/enter-main/packages/create-daomind

---

## 🎬 结语

完成这些步骤后，DaoMind 将正式上线！

**预期结果**：
- ✅ 文档站点在线访问
- ✅ CLI 工具可通过 npm 安装
- ✅ 用户可以一键创建 DaoMind 项目
- ✅ 项目准备接受社区贡献

**下一步**：
1. 监控部署状态
2. 修复任何部署问题
3. 开始社区推广
4. 收集用户反馈

---

**创建日期**: 2026-04-15  
**作者**: DaoMind Team  
**版本**: 1.0

> "道生一，一生二，二生三，三生万物"  
> 从本地到云端，DaoMind 即将影响世界！🚀
