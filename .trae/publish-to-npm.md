# 发布到 npm

## 📋 发布前检查清单

- [x] 所有包版本已更新到 2.0.0
- [x] 代码已构建成功
- [x] Lint 检查通过
- [x] 测试通过
- [x] Git 标签已创建 (v2.0.0)
- [x] 代码已推送到 GitHub

## 🔐 准备工作

### 1. 登录 npm

```bash
# 登录 npm (如果未登录)
npm login

# 验证登录状态
npm whoami
```

### 2. 检查包配置

所有 17 个包都已配置好：
- ✅ 版本号: 2.0.0
- ✅ 包名: @daomind/* 和 @modulux/*
- ✅ 导出配置正确
- ✅ TypeScript 声明文件已生成

## 📦 发布到 npm

### 方式一：使用 pnpm 工作区发布（推荐）

```bash
# 在项目根目录执行
cd /workspace/thread

# 确保所有包已构建
pnpm build

# 发布所有包到 npm (公开访问)
pnpm publish --access public -r --no-git-checks

# 或者发布到特定 tag (如 beta)
pnpm publish --access public -r --tag beta --no-git-checks
```

### 方式二：逐个包发布

```bash
cd packages/daoNothing
npm publish --access public

cd ../daoAnything
npm publish --access public

# ... 依此类推其他包
```

### 发布参数说明

- `--access public`: 公开发布 (scoped 包默认私有)
- `-r` / `--recursive`: 递归发布所有工作区包
- `--no-git-checks`: 跳过 git 状态检查
- `--tag <tag>`: 发布到指定标签 (默认是 `latest`)
- `--dry-run`: 预演发布 (不实际发布)

## 🧪 预演发布 (推荐先执行)

```bash
# 预演发布，查看将要发布什么
pnpm publish --access public -r --dry-run

# 检查每个包的 package.json
for pkg in packages/*/package.json; do
  echo "=== $(dirname $pkg) ==="
  cat $pkg | grep -E '"name"|"version"|"main"|"types"|"exports"'
done
```

## 📦 将发布的包列表

1. @daomind/nothing@2.0.0
2. @daomind/anything@2.0.0
3. @daomind/agents@2.0.0
4. @daomind/apps@2.0.0
5. @daomind/benchmark@2.0.0
6. @daomind/chronos@2.0.0
7. @daomind/collective@2.0.0
8. @daomind/docs@2.0.0
9. @daomind/feedback@2.0.0
10. @daomind/monitor@2.0.0
11. @daomind/nexus@2.0.0
12. @daomind/pages@2.0.0
13. @daomind/skills@2.0.0
14. @daomind/spaces@2.0.0
15. @daomind/times@2.0.0
16. @daomind/verify@2.0.0
17. @modulux/qi@2.0.0

## ✅ 验证发布

发布完成后，验证包是否可用：

```bash
# 搜索包
npm search @daomind/nothing

# 查看包信息
npm view @daomind/nothing
npm view @daomind/anything

# 安装测试
npm install @daomind/nothing@2.0.0
```

在线查看：
- https://www.npmjs.com/package/@daomind/nothing
- https://www.npmjs.com/package/@daomind/anything
- ... 等

## ⚠️ 注意事项

1. **npm 账号权限**: 确保您有 `@daomind` 和 `@modulux` 组织的发布权限
2. **版本号不可重复**: npm 不允许发布已存在的版本号
3. **发布后无法撤销**: 发布后 24 小时内可以撤销，之后只能弃用
4. **依赖关系**: 确保包之间的依赖版本正确

## 🔧 故障排查

### 问题 1: 权限错误
```
Error: You do not have permission to publish "@daomind/nothing"
```
**解决**: 
- 确保已登录正确的 npm 账号
- 联系组织管理员添加发布权限
- 或创建新的组织

### 问题 2: 版本已存在
```
Error: You cannot publish over the previously published versions
```
**解决**: 
- 更新版本号到 2.0.1 或更高
- 或使用不同的 tag (如 `--tag next`)

### 问题 3: 包名冲突
```
Error: Package name too similar to existing package
```
**解决**: 
- 使用 scoped 包名 (@daomind/*)
- 或选择不同的包名

## 📊 发布后的工作

1. **更新文档**
   - README.md 添加安装说明
   - 更新使用示例

2. **发布公告**
   - 在 GitHub Release 中提及 npm 发布
   - 社交媒体宣传

3. **监控下载量**
   - https://npm-stat.com/charts.html?package=@daomind/nothing

4. **收集反馈**
   - GitHub Issues
   - npm 评论
   - 社区讨论

