# npm 登录完全指南

## 📋 前提条件

### 如果您还没有 npm 账号

1. **访问 npm 官网注册**
   - 网址：https://www.npmjs.com/signup
   - 填写：用户名、邮箱、密码
   - 验证邮箱

2. **启用双因素认证（2FA）- 推荐**
   - 登录 https://www.npmjs.com
   - 进入 Account Settings → Two-Factor Authentication
   - 使用 Google Authenticator 或其他验证器 APP

## 🔐 登录步骤

### 方法 1: 交互式登录（推荐）

```bash
npm login
```

**系统会提示输入：**

```
Username: [输入您的 npm 用户名]
Password: [输入您的密码，不会显示]
Email: (this IS public) [输入您的邮箱]
```

如果启用了 2FA：
```
Enter one-time password: [输入验证器 APP 上的 6 位数字]
```

**成功后会显示：**
```
Logged in as [您的用户名] on https://registry.npmjs.org/.
```

### 方法 2: 使用 Access Token（适合 CI/CD）

1. **生成 Access Token**
   - 访问：https://www.npmjs.com/settings/[用户名]/tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 或 "Publish" 类型
   - 复制生成的 token（只显示一次！）

2. **配置 .npmrc 文件**
   ```bash
   echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN_HERE" > ~/.npmrc
   ```

### 方法 3: 使用旧版登录（Legacy）

```bash
npm login --auth-type=legacy
```

## 🔍 验证登录状态

```bash
# 查看当前登录用户
npm whoami

# 应该显示您的用户名
```

## ⚠️ 常见问题

### 问题 1: "Unable to authenticate"

**原因**：
- 用户名或密码错误
- 2FA 验证码过期
- 网络问题

**解决方案**：
```bash
# 先登出
npm logout

# 重新登录
npm login
```

### 问题 2: "401 Unauthorized" 或 "403 Forbidden"

**原因**：
- Token 已过期
- Token 权限不足

**解决方案**：
```bash
# 删除旧配置
rm ~/.npmrc

# 重新登录
npm login
```

### 问题 3: 2FA 验证失败

**原因**：
- 验证码输入错误
- 时间不同步

**解决方案**：
- 确保设备时间准确
- 等待新的验证码（每 30 秒刷新）
- 重新输入

### 问题 4: "This command requires you to be logged in"

**解决方案**：
```bash
# 检查登录状态
npm whoami

# 如果未登录，执行登录
npm login
```

## 📦 针对本项目的发布流程

### 步骤 1: 登录 npm

```bash
npm login
```

输入您的凭证。

### 步骤 2: 验证登录

```bash
npm whoami
```

应该显示您的用户名。

### 步骤 3: 检查组织权限

本项目需要以下组织的发布权限：
- `@daomind` 组织
- `@modulux` 组织

**检查方法**：
```bash
# 查看您所在的组织
npm org ls
```

**如果没有权限**：

#### 选项 A: 创建组织（推荐）

1. 访问：https://www.npmjs.com/org/create
2. 创建 `@daomind` 组织（免费）
3. 创建 `@modulux` 组织（免费）

#### 选项 B: 联系现有组织管理员

如果组织已存在，请管理员添加您：
```bash
# 管理员执行（示例）
npm org add @daomind your-username
npm org add @modulux your-username
```

#### 选项 C: 修改包名

如果无法获得组织权限，可以修改为您的个人命名空间：

```bash
# 批量修改包名示例
cd /workspace/thread

# 将 @daomind 改为 @your-username
find packages -name "package.json" -exec sed -i 's/@daomind/@your-username/g' {} \;
find packages -name "package.json" -exec sed -i 's/@modulux/@your-username/g' {} \;
```

### 步骤 4: 执行发布

登录成功后，执行：

```bash
# 使用自动化脚本
/tmp/npm-publish.sh
```

或手动执行：

```bash
cd /workspace/thread

# 预演发布（检查）
pnpm publish --access public -r --dry-run

# 确认无误后正式发布
pnpm publish --access public -r --no-git-checks
```

## 🔐 安全建议

1. **启用双因素认证（2FA）**
   - 必须启用，保护账号安全
   - 使用 Google Authenticator、Authy 等 APP

2. **使用强密码**
   - 至少 12 位
   - 包含大小写字母、数字、特殊字符

3. **定期更换 Token**
   - Access Token 应定期轮换
   - 不要在公开代码中暴露 Token

4. **限制 Token 权限**
   - 使用最小权限原则
   - 发布用途选择 "Publish" 类型
   - CI/CD 用途选择 "Automation" 类型

## 📚 相关链接

- npm 官网：https://www.npmjs.com
- npm 文档：https://docs.npmjs.com
- 注册账号：https://www.npmjs.com/signup
- 管理 Token：https://www.npmjs.com/settings/tokens
- 创建组织：https://www.npmjs.com/org/create
- 双因素认证设置：https://www.npmjs.com/settings/two-factor-authentication

## 🎯 快速参考

```bash
# 登录
npm login

# 验证登录
npm whoami

# 查看配置
npm config list

# 登出
npm logout

# 发布（登录后）
pnpm publish --access public -r --no-git-checks
```

---

**提示**：首次发布新包时，npm 会要求您确认邮箱。请检查您的邮箱并点击确认链接。
