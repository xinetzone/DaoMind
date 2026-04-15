# create-daomind

快速创建 DaoMind 项目的脚手架工具。

## 🚀 使用方法

### pnpm (推荐)

```bash
pnpm create daomind
```

### npm

```bash
npm create daomind@latest
```

### yarn

```bash
yarn create daomind
```

## 📦 可用模板

### Hello World
最简单的入门示例，理解"无名"与"有名"的核心概念。

```bash
pnpm create daomind my-project --template hello-world
```

### Counter
状态管理和不可变更新示例。

```bash
pnpm create daomind my-counter --template counter
```

### Todo List
完整的 CRUD 操作和数据管理。

```bash
pnpm create daomind my-todo --template todo-list
```

### User Management
用户管理和权限控制系统。

```bash
pnpm create daomind my-users --template user-management
```

## 💻 命令行选项

```bash
# 指定项目名称
pnpm create daomind my-project

# 指定模板
pnpm create daomind my-project --template counter

# 简写
pnpm create daomind my-project -t todo-list
```

## 🎯 交互模式

不指定任何参数时，会进入交互模式：

```bash
pnpm create daomind

╔════════════════════════════════════════════╗
║  Create DaoMind Project                    ║
╚════════════════════════════════════════════╝

? 项目名称: › daomind-project
? 选择模板: › 
  ❯ Hello World - 最简单的入门示例
    Counter - 状态管理和不可变更新
    Todo List - CRUD 操作和数据管理
    User Management - 用户管理和权限控制
```

## 📂 项目结构

创建的项目包含：

```
my-project/
├── src/
│   ├── types.ts          # 类型定义（无名层）
│   ├── module.ts         # 模块实现
│   └── index.ts          # 主入口
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 开发项目

创建项目后：

```bash
cd my-project
pnpm install
pnpm dev
```

## 📚 资源

- [文档](https://github.com/xinetzone/DaoMind/tree/enter-main/docs)
- [示例](https://github.com/xinetzone/DaoMind/tree/enter-main/docs/examples)
- [API 参考](https://github.com/xinetzone/DaoMind/blob/enter-main/docs/api/API-REFERENCE.md)

## 📄 许可证

MIT
