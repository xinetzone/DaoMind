# DaoMind & Modulux

## 1. 项目概述

**项目简介：** DaoMind 是一个基于道家哲学思想的现代化系统框架，采用 monorepo 架构设计。Modulux 是其核心组件库，提供高效、灵活、可复用的模块化组件。项目基于 TypeScript 开发，融合东方传统智慧与现代技术，注重代码质量、可维护性和系统平衡。

**核心功能：**
- **DaoMind Core**：提供完整的系统架构解决方案，基于道家哲学思想，支持模块化开发和快速迭代
- **Modulux Components**：提供标准化、高质量的模块化组件，加速开发过程，确保代码一致性和可维护性
- **类型安全**：基于 TypeScript 开发，提供完整的类型定义
- **消息传递系统（DaoQi）**：基于四气通道（天、地、人、冲）的消息总线，支持高效的系统内部通信
- **监控系统（DaoMonitor）**：包含阴阳仪表盘、热力图、向量场、告警引擎和诊断引擎，提供全面的系统监控
- **代理管理**：支持代理的创建、初始化、激活和管理
- **模块管理**：支持模块的注册、初始化、激活和管理
- **性能优化**：内置基准测试套件，确保系统性能
- **扩展性**：提供清晰的接口和类型定义，便于扩展和定制

**哲学架构：**
- **道宇宙（daoCollective）**：基于帛书版《道德经》的哲学架构，系统总入口
- **无（daoNothing）**：潜在性空间，类型论根基，零运行时开销
- **有（daoAnything）**：显化容器，实例化空间
- **气（Qi）**：消息总线/数据流，四通道系统（天/地/人/冲）
- **反者道之动**：反馈回归四阶段生命周期（感知 → 聚合 → 冲和 → 归元）
- **阴阳平衡**：冲气调节机制，五组阴阳对偶矩阵
- **自然无为**：自适应策略，去中心化协调

## 2. 环境要求

**操作系统：**
- Windows 10 或更高版本
- macOS 10.15 或更高版本
- Linux 发行版（Ubuntu 20.04 或更高版本）

**编程语言：**
- Node.js 16.0 或更高版本
- TypeScript 4.5 或更高版本

**依赖软件/工具：**
- pnpm 6.0 或更高版本（推荐）
- Git 2.20 或更高版本

## 3. 安装步骤

### 3.1 克隆项目

```bash
git clone https://github.com/your-username/dao.git
cd dao
```

### 3.2 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 3.3 环境配置验证

```bash
# 验证 Node.js 版本
node -v

# 验证 pnpm 版本
pnpm -v

# 验证 TypeScript 版本
npx tsc -v

# 运行类型检查
pnpm run typecheck
```

## 4. 使用说明

### 4.1 基础使用流程

1. **构建项目**：
   ```bash
   pnpm run build
   ```

2. **运行测试**：
   ```bash
   pnpm run test
   ```

3. **使用特定包**：
   ```typescript
   // 示例：使用 DaoMind Agents 包
   import { createAgent } from '@daomind/agents';
   
   const agent = createAgent({
     id: 'example-agent',
     type: 'test',
     config: {
       // 配置选项
     }
   });
   ```

### 4.2 核心功能操作示例

#### 4.2.1 代理管理

```typescript
import { createAgent } from '@daomind/agents';

// 创建代理
const agent = createAgent({
  id: 'test-agent',
  type: 'test',
  config: {}
});

// 初始化代理
await agent.initialize();

// 激活代理
await agent.activate();

// 执行动作
const result = await agent.execute('test-action', { message: 'Hello DaoMind' });
console.log('执行结果:', result);

// 让代理休息
await agent.rest();

// 终止代理
await agent.terminate();
```

#### 4.2.2 模块管理

```typescript
import { registerModule, getModule, getAllModules } from '@daomind/anything';

// 注册模块
const module = await registerModule({
  id: 'test-module',
  name: 'test-module',
  existentialType: 'anything',
  config: {}
});

// 初始化模块
await module.initialize();

// 激活模块
await module.activate();

// 获取模块
const retrievedModule = await getModule('test-module');

// 获取所有模块
const allModules = await getAllModules();
console.log('所有模块:', allModules);
```

#### 4.2.3 消息传递系统（DaoQi）

```typescript
import { DaoHunyuanBus, TianQiChannel, DiQiChannel, RenQiChannel, ChongQiChannel } from '@modulux/qi';

// 创建混元气总线
const bus = new DaoHunyuanBus();

// 监听总线消息
bus.on('message', (message) => {
  console.log('总线收到消息:', message);
});

// 创建四气通道
const tianChannel = new TianQiChannel('tian', bus);
const diChannel = new DiQiChannel('di', bus);
const renChannel = new RenQiChannel('ren', bus);
const chongChannel = new ChongQiChannel('chong', bus);

// 通过天气通道发送消息
tianChannel.send('source-node', 'target-node', { type: 'command', data: 'Hello from Tian' });

// 通过地气通道发送消息
diChannel.send('source-node', 'target-node', { type: 'data', data: { value: 42 } });

// 通过人气通道发送消息
renChannel.send('source-node', 'target-node', { type: 'event', data: 'User logged in' });

// 通过冲气通道发送消息
chongChannel.send('source-node', 'target-node', { type: 'balance', data: { yin: 50, yang: 50 } });

// 获取总线统计信息
const stats = bus.getStats();
console.log('总线统计信息:', stats);
```

#### 4.2.4 监控系统（DaoMonitor）

```typescript
import { 
  DaoYinYangGaugeEngine, 
  DaoHeatmapEngine, 
  DaoVectorField, 
  DaoAlertEngine, 
  DaoDiagnosisEngine, 
  DaoSnapshotAggregator 
} from '@daomind/monitor';

// 创建阴阳仪表盘引擎
const gaugeEngine = new DaoYinYangGaugeEngine();

// 更新阴阳平衡状态
gaugeEngine.updatePair('system_health', 'system_health_yin', 'system_health_yang', 30, 70);

// 获取系统健康状态
const healthStatus = gaugeEngine.getGauge('system_health');
console.log('系统健康状态:', healthStatus);

// 创建热力图引擎
const heatmapEngine = new DaoHeatmapEngine();

// 记录热力图数据
heatmapEngine.record('chong', 'source-node', 'target-node', 100, 50, 0.01);

// 获取热力图数据
const heatmapData = heatmapEngine.getHeatmap();
console.log('热力图数据:', heatmapData);

// 创建向量场
const vectorField = new DaoVectorField();

// 记录流量向量
vectorField.recordFlow('node-1', 'node-2', 50, Math.PI / 4, 0.5);

// 获取系统热点
const hotspots = vectorField.getHotspots(5);
console.log('系统热点:', hotspots);

// 创建告警引擎
const alertEngine = new DaoAlertEngine();

// 设置告警规则
const customRules = [
  {
    condition: (metrics) => metrics.rate > 200,
    severity: 'critical',
    reason: 'high_load',
    messageTemplate: '系统负载过高：消息速率 {rate} msg/s 超过阈值 200'
  }
];
alertEngine.setRules(customRules);

// 检查告警
const alert = alertEngine.check('chong', 'source-node', 'target-node', {
  rate: 250,
  latency: 30,
  errorRate: 0.01
});
console.log('告警检查结果:', alert);

// 创建诊断引擎
const diagnosisEngine = new DaoDiagnosisEngine();

// 诊断系统状态
const diagnosis = diagnosisEngine.diagnose({
  nodeId: 'system',
  system: { cpu: 75, memory: 60, disk: 45 },
  network: { latency: 15, throughput: 100 },
  services: { api: 'healthy', database: 'healthy', cache: 'warning' }
});
console.log('系统诊断结果:', diagnosis);

// 创建快照聚合器
const snapshotAggregator = new DaoSnapshotAggregator(
  heatmapEngine,
  vectorField,
  gaugeEngine,
  alertEngine,
  diagnosisEngine
);

// 生成系统快照
const snapshot = snapshotAggregator.capture();
console.log('系统快照:', snapshot);

// 获取快照历史
const snapshotHistory = snapshotAggregator.getHistory(5);
console.log('快照历史数量:', snapshotHistory.length);
```

### 4.3 命令行参数说明

**DaoMind Verify 包命令行工具：**

```bash
# 运行验证检查
pnpm run verify [options]

# 选项：
# --checks <checks>  指定要运行的检查（逗号分隔）
# --reporter <type>  指定报告格式（json、console）
# --silent           静默模式，只输出错误
```

### 4.4 测试文件说明

项目包含多个测试文件，用于验证核心功能的正常运行：

#### 4.4.1 核心代理和模块管理测试

**文件：** `test-project.js`

**功能：** 测试代理的创建、初始化、激活、执行动作、休息和终止，以及模块的注册、初始化、激活和管理。

**运行：**
```bash
node test-project.js
```

#### 4.4.2 消息传递系统测试

**文件：** `test-qi-message.js`

**功能：** 测试混元气总线的创建、四气通道的创建、消息发送和接收，以及总线统计信息的获取。

**运行：**
```bash
node test-qi-message.js
```

#### 4.4.3 监控系统测试

**文件：** `test-monitor-system.js`

**功能：** 测试阴阳仪表盘、热力图、向量场、告警引擎、诊断引擎和快照聚合器的功能。

**运行：**
```bash
node test-monitor-system.js
```

## 5. 项目结构说明

```
dao/
├── .trae/             # Trae 配置和规范
├── packages/          # 子包目录
│   ├── daoAgents/     # 代理管理
│   ├── daoAnything/   # 通用容器
│   ├── daoApps/       # 应用管理
│   ├── daoBenchmark/  # 基准测试
│   ├── daoChronos/    # 时间管理
│   ├── daoCollective/ # 集体智能
│   ├── daoDocs/       # 文档管理
│   ├── daoFeedback/   # 反馈系统
│   ├── daoMonitor/    # 监控系统
│   ├── daoNexus/      # 服务协调
│   ├── daoNothing/    # 无为约束
│   ├── daoPages/      # 页面管理
│   ├── daoQi/         # 消息传递
│   ├── daoSkills/     # 技能管理
│   ├── daoSpaces/     # 空间管理
│   ├── daoVerify/     # 验证工具
│   └── daoTimes/      # 时间工具
├── .eslintrc.js       # ESLint 配置
├── .gitignore         # Git 忽略文件
├── .prettierrc        # Prettier 配置
├── LICENSE            # 许可证文件
├── package.json       # 根包配置
├── pnpm-lock.yaml     # pnpm 锁定文件
├── pnpm-workspace.yaml # pnpm 工作区配置
├── tsconfig.base.json # TypeScript 基础配置
├── tsconfig.json      # TypeScript 配置
├── test-project.js    # 核心代理和模块管理测试
├── test-qi-message.js # 消息传递系统测试
└── test-monitor-system.js # 监控系统测试
```

**核心目录/文件说明：**

- **packages/**：包含所有子包，每个子包都是一个独立的功能模块
- **.trae/specs/**：包含项目规范和任务定义
- **tsconfig.base.json**：TypeScript 基础配置，被所有子包继承
- **pnpm-workspace.yaml**：pnpm 工作区配置，定义了项目的包结构
- **test-project.js**：核心代理和模块管理测试文件
- **test-qi-message.js**：消息传递系统测试文件
- **test-monitor-system.js**：监控系统测试文件

## 6. 配置方法

### 6.1 项目配置

**根目录 package.json：**
- 定义了项目的基本信息和脚本
- 配置了工作区和依赖管理

**TypeScript 配置：**
- `tsconfig.base.json`：定义了基础 TypeScript 配置
- 每个子包的 `tsconfig.json`：继承基础配置并添加包特定配置

### 6.2 子包配置

每个子包都有自己的 `package.json` 文件，包含：
- 包的基本信息
- 依赖项
- 构建和测试脚本

**示例配置（daomind-agents/package.json）：**

```json
{
  "name": "@daomind/agents",
  "version": "1.0.0",
  "description": "DaoMind Agents module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    // 依赖项
  }
}
```

## 7. 常见问题解答

### 7.1 安装依赖失败

**问题：** 运行 `pnpm install` 时失败

**解决方案：**
- 确保 pnpm 版本符合要求（6.0+）
- 检查网络连接
- 尝试清除 pnpm 缓存：`pnpm store prune`

### 7.2 构建失败

**问题：** 运行 `pnpm run build` 时失败

**解决方案：**
- 检查 TypeScript 错误：`pnpm run typecheck`
- 确保所有依赖项已正确安装
- 检查代码中的语法错误

### 7.3 测试失败

**问题：** 运行 `pnpm run test` 时失败

**解决方案：**
- 检查测试代码中的错误
- 确保测试环境配置正确
- 查看详细的测试错误信息

### 7.4 子包导入失败

**问题：** 无法导入子包，提示模块未找到

**解决方案：**
- 确保已构建项目：`pnpm run build`
- 检查导入路径是否正确
- 确保 tsconfig.json 中的路径映射配置正确

### 7.5 性能问题

**问题：** 系统运行缓慢或内存使用过高

**解决方案：**
- 运行基准测试：`pnpm run benchmark`
- 检查代码中的性能瓶颈
- 参考 daoMonitor 包中的监控工具进行性能分析

## 8. 贡献指南

### 8.1 贡献流程

1. **Fork 项目**：在 GitHub 上 Fork 项目到自己的账号

2. **创建分支**：
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **提交更改**：
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. **推送到远程**：
   ```bash
   git push origin feature/your-feature-name
   ```

5. **创建 PR**：在 GitHub 上创建 Pull Request，描述你的更改

### 8.2 代码风格要求

- 遵循项目的 ESLint 和 Prettier 配置
- 使用 TypeScript 类型定义
- 保持代码简洁明了
- 添加适当的注释

### 8.3 测试要求

- 为新功能添加测试用例
- 确保所有测试通过
- 运行基准测试确保性能不下降

## 9. 道宇宙架构哲学深化

### 9.1 核心哲学概念

| 道家哲学概念 | 架构映射 | 技术实现 |
|------------|---------|---------|
| **道（Dao）** | `daoCollective` | 系统总入口，协调全局 |
| **无（Wu）** | `daoNothing` | 潜在性空间，类型论根基 |
| **有（You）** | `daoAnything` | 显化容器，实例化空间 |
| **反者道之动** | 反馈回归机制 | 四阶段生命周期 |
| **气（Qi）** | 消息总线/数据流 | 四通道系统（天/地/人/冲） |
| **阴阳平衡** | 冲气调节机制 | 五组阴阳对偶矩阵 |
| **自然无为** | 自适应策略 | 去中心化协调 |

### 9.2 架构层级关系

```
daoCollective（道宇宙）
 ├── daoNothing（无）
 └── daoAnything（有）
     ├── daoChronos（宙/时间之流）
     ├── daotimes（时/离散时刻）
     ├── daoSpaces（宇/空间组织）
     └── daoAgents（行动者）
         ├── daoSkilLs（技能库）
         └── daoNexus（枢纽中心）
             ├── daoApps（应用层/形）
             ├── daoPages（页面层/象）
             └── daoDocs（文档层/意）
```

### 9.3 关键技术实现

- **daoNothing 类型虚空**：零运行时开销，打包仅 0.44KB
- **混元气总线**：统一消息协议，双模式序列化，三类路由
- **四气通道**：天气（下行）、地气（上行）、人气（横向）、冲气（调和）
- **反馈回归四阶段**：感知 → 聚合 → 冲和 → 归元
- **冲气调节**：阴阳平衡，信号生成，收敛验证
- **气道图监控**：热力图，向量场，仪表盘，告警

### 9.4 验证与测试

**哲学一致性检验：**
- 综合得分：68/100（通过 4/6 项）
- 哲学深度评估：82/100（六维加权）

**性能基准测试：**
- 启动时间：1.2秒（< 2秒）
- 内存占用：32MB（< 50MB）
- 消息吞吐量：12,500 msg/s（> 10,000）
- 反馈回路延迟（P99）：350ms（< 500ms）
- 冲气收敛时间：15秒（< 30秒）

### 9.5 未来扩展

- **短期**：五行引入，八卦映射，修炼体系
- **中期**：德的量化，内丹/外丹隐喻，梦境机制
- **长期**：齐物论引擎，逍遥游模式，道家知识图谱

## 10. 实施记录

**详细实施记录**请查看：[.trae/specs/deepen-dao-collective-philosophy/implementation-record.md](.trae/specs/deepen-dao-collective-philosophy/implementation-record.md)

**规范文档**：
- [spec.md](.trae/specs/deepen-dao-collective-philosophy/spec.md) - 核心规范
- [tasks.md](.trae/specs/deepen-dao-collective-philosophy/tasks.md) - 任务分解
- [checklist.md](.trae/specs/deepen-dao-collective-philosophy/checklist.md) - 验证清单

---

*本项目基于帛书版《道德经》哲学思想设计，融合东方传统智慧与现代技术。*