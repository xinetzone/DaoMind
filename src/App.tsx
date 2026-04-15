import React from 'react';

export default function App() {
  const packages = [
    { name: 'daoNothing', desc: '潜在性空间，万物之源 - 定义系统的基础契约与类型' },
    { name: 'daoAnything', desc: '万物容器 - 模块注册、生命周期管理' },
    { name: 'daoAgents', desc: '智能体系统 - Agent 注册与能力管理' },
    { name: 'daoQi', desc: '消息系统 - 事件驱动的通信机制' },
    { name: 'daoMonitor', desc: '监控系统 - 性能追踪与指标收集' },
    { name: 'daoVerify', desc: '验证系统 - 数据校验与契约验证' },
    { name: 'daoChronos', desc: '时间系统 - 定时任务与时间管理' },
    { name: 'daoCollective', desc: '集体智慧 - 协作与共识机制' },
    { name: 'daoDocs', desc: '文档系统 - 知识管理' },
    { name: 'daoFeedback', desc: '反馈系统 - 用户反馈收集' },
    { name: 'daoNexus', desc: '连接枢纽 - 系统集成' },
    { name: 'daoPages', desc: '页面系统 - 路由管理' },
    { name: 'daoSkilLs', desc: '技能系统 - 能力扩展' },
    { name: 'daoSpaces', desc: '空间系统 - 命名空间管理' },
    { name: 'daotimes', desc: '时代系统 - 版本与历史' },
    { name: 'daoBenchmark', desc: '基准测试 - 性能评估' },
    { name: 'daoApps', desc: '应用系统 - 应用程序管理' },
  ];

  return (
    <div className="app">
      <header className="header">
        <h1>DaoMind Modulux</h1>
        <p className="subtitle">现代化系统框架与模块化组件库</p>
      </header>

      <main className="main">
        <section className="intro">
          <h2>🌟 项目简介</h2>
          <p>
            DaoMind Modulux 是一个受道家哲学启发的模块化系统框架。
            基于帛书《道德经》"无名，万物之始也；有名，万物之母也"的理念，从最基础的类型契约（无名）开始，构建完整的企业级应用生态（有名）。
          </p>
        </section>

        <section className="packages">
          <h2>📦 核心包列表</h2>
          <div className="package-grid">
            {packages.map((pkg) => (
              <div key={pkg.name} className="package-card">
                <h3>@daomind/{pkg.name.replace('dao', '').toLowerCase()}</h3>
                <p>{pkg.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="architecture">
          <h2>🏗️ 架构特点</h2>
          <ul>
            <li>
              <strong>类型安全:</strong> 完整的 TypeScript 类型定义
            </li>
            <li>
              <strong>模块化:</strong> 独立包设计，按需引入
            </li>
            <li>
              <strong>事件驱动:</strong> 基于消息的松耦合通信
            </li>
            <li>
              <strong>可扩展:</strong> 灵活的插件与能力系统
            </li>
            <li>
              <strong>可测试:</strong> 完善的单元测试覆盖
            </li>
          </ul>
        </section>

        <section className="usage">
          <h2>🚀 快速开始</h2>
          <pre className="code-block">
{`# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试
pnpm test`}
          </pre>
        </section>
      </main>

      <footer className="footer">
        <p>
          Built with ❤️ by DaoMind Team |{' '}
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
