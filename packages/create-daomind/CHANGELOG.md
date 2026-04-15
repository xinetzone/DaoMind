# Changelog

All notable changes to `create-daomind` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-15

### Added
- ✅ Interactive command-line interface using prompts
- ✅ Four production-ready templates:
  - `template-hello-world`: Simplest introduction to DaoMind
  - `template-counter`: State management and immutable updates
  - `template-todo-list`: Full CRUD operations and data management
  - `template-user-management`: RBAC, authentication, and permissions
- ✅ Automatic package manager detection (pnpm, npm, yarn)
- ✅ Directory overwrite confirmation
- ✅ Colorful terminal output using kolorist
- ✅ Complete template files with:
  - Source code with detailed comments
  - TypeScript configuration
  - Package.json with dependencies
  - Comprehensive README
  - tsconfig.json

### Features
- 🎯 One-command project creation
- 📦 Zero configuration required
- 🚀 Production-ready code
- 📚 Detailed documentation in templates
- 🔧 Works with pnpm, npm, and yarn
- ⚡ Fast and lightweight

### Philosophy
Based on the silk manuscript Dao De Jing: "无名，万物之始也；有名，万物之母也"
(Nameless is the beginning of all things; Named is the mother of all things)

All templates demonstrate the DaoMind philosophy of:
- Type Space ("无名" - Nameless) = Compile-time contracts
- Value Space ("有名" - Named) = Runtime instances

### Template Details

#### Hello World (template-hello-world)
- **Difficulty**: ⭐ Beginner
- **Learning Time**: 15 minutes
- **Concepts**: ExistenceContract, Basic module creation
- **Files**: 6 files, ~170 lines

#### Counter (template-counter)
- **Difficulty**: ⭐⭐ Beginner+
- **Learning Time**: 30 minutes
- **Concepts**: State management, Immutable updates, Event system
- **Files**: 6 files, ~300 lines

#### Todo List (template-todo-list)
- **Difficulty**: ⭐⭐ Intermediate
- **Learning Time**: 45 minutes
- **Concepts**: CRUD operations, Service layer, Data filtering
- **Files**: 7 files, ~550 lines

#### User Management (template-user-management)
- **Difficulty**: ⭐⭐⭐ Intermediate+
- **Learning Time**: 60 minutes
- **Concepts**: RBAC, Authentication, Permissions, Security best practices
- **Files**: 8 files, ~750 lines

### Usage

```bash
# Using pnpm (recommended)
pnpm create daomind my-project

# Using npm
npm create daomind@latest my-project

# Using yarn
yarn create daomind my-project
```

### Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Link for local testing
pnpm link --global

# Test locally
create-daomind test-project
```

### Publishing

```bash
# Build
pnpm build

# Publish to npm
pnpm publish --access public
```

### Dependencies
- prompts: ^2.4.2 - Interactive command-line prompts
- kolorist: ^1.8.0 - Terminal colors

### Dev Dependencies
- @types/prompts: ^2.4.4
- typescript: ^5.7.2

### Repository
https://github.com/xinetzone/DaoMind

### License
MIT

### Author
DaoMind Team

---

## Future Releases

### [2.1.0] - Planned
- [ ] Add `--template` flag to skip interactive prompt
- [ ] Add `--yes` flag to use defaults
- [ ] Add template preview before creation
- [ ] Support custom template URLs
- [ ] Add update checker

### [2.2.0] - Planned
- [ ] Add more advanced templates
- [ ] Support remote template repositories
- [ ] Add template search functionality
- [ ] Generate project from existing code

---

> "道生一，一生二，二生三，三生万物"  
> From core concepts to complete ecosystem, DaoMind is flourishing!
