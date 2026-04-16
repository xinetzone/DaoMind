import React from 'react';
import { Zap, Box, Lock, Radio, BarChart3, Layers } from 'lucide-react';

/** 道 Logo — 内联 SVG，无外部文件依赖 */
function DaoLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="DaoMind"
    >
      {/* 外圆 */}
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      {/* S 曲线分割 */}
      <path
        d="M16 2 C16 2, 8 9, 16 16 C24 23, 16 30, 16 30"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* 上半阴鱼点（小实心圆） */}
      <circle cx="16" cy="9" r="2.5" fill="currentColor" />
      {/* 下半阳鱼点（小空心圆） */}
      <circle cx="16" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

const features = [
  {
    Icon: Layers,
    title: '哲学驱动',
    desc: '基于帛书《道德经》"无名，万物之始；有名，万物之母"，将类型系统与值系统进行清晰的哲学映射。',
  },
  {
    Icon: Zap,
    title: '零运行时开销',
    desc: '类型定义在编译后完全消失，享受完整类型检查的好处，却没有任何运行时性能损耗。',
  },
  {
    Icon: Box,
    title: '模块化架构',
    desc: '19+ 独立包，从基础契约到完整生态，包含 Agent 系统、消息总线、监控等完整工具链。',
  },
  {
    Icon: Lock,
    title: '类型安全',
    desc: '基于 TypeScript 5.9 严格模式，在编译期捕获错误，提供出色的 IDE 智能提示。',
  },
  {
    Icon: Radio,
    title: '四气通道',
    desc: '天地人冲四通道消息总线（DaoQi），基于道家四气理论的事件驱动通信机制。',
  },
  {
    Icon: BarChart3,
    title: '全面监控',
    desc: '阴阳仪表盘、热力图、向量场、告警引擎，完整的系统可观测性解决方案。',
  },
];

const packages = [
  { name: '@daomind/nothing',    desc: '无（潜在性空间）- 基础契约与类型定义' },
  { name: '@daomind/anything',   desc: '有（显化容器）- 模块注册与生命周期管理' },
  { name: '@daomind/agents',     desc: '智能体系统 - Agent 注册与能力管理' },
  { name: '@daomind/apps',       desc: '应用层 - 可执行程序注册与状态管理' },
  { name: '@daomind/collective', desc: '道宇宙根节点 - 统一门面与系统快照' },
  { name: '@modulux/qi',         desc: '气（消息总线）- 四通道事件通信' },
  { name: '@daomind/monitor',    desc: '监控系统 - 性能追踪与指标收集' },
  { name: '@daomind/verify',     desc: '验证系统 - 数据校验与契约验证' },
  { name: '@daomind/chronos',    desc: '时间系统 - 定时任务与时间管理' },
  { name: '@daomind/feedback',   desc: '反馈系统 - 四阶段生命周期调节' },
  { name: '@daomind/nexus',      desc: '连接枢纽 - 系统集成与负载均衡' },
  { name: '@daomind/spaces',     desc: '空间系统 - 命名空间与隔离管理' },
  { name: '@daomind/skills',     desc: '技能系统 - 能力组合与动态扩展' },
  { name: '@daomind/benchmark',  desc: '基准测试 - 性能评估与优化指导' },
];

const stats = [
  { number: '19+', label: '核心包' },
  { number: '877', label: '测试用例' },
  { number: '100%', label: '类型安全' },
  { number: 'MIT', label: '开源协议' },
];

export default function App(): React.JSX.Element {
  return (
    <>
      {/* Navbar */}
      <nav className="nav">
        <a href="/" className="nav-brand">
          <DaoLogo className="nav-logo" />
          DaoMind & Modulux
        </a>
        <div className="nav-links">
          <a href="https://xinetzone.github.io/DaoMind/guide/" target="_blank" rel="noreferrer">文档</a>
          <a href="https://xinetzone.github.io/DaoMind/api/" target="_blank" rel="noreferrer">API</a>
          <a href="https://xinetzone.github.io/DaoMind/examples/" target="_blank" rel="noreferrer">示例</a>
          <a href="https://github.com/xinetzone/DaoMind" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://xinetzone.github.io/DaoMind/" target="_blank" rel="noreferrer" className="nav-cta">
            查看文档站
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            v2.23.0 · TypeScript 5.9 · MIT License
          </div>
          <h1 className="hero-title">DaoMind & Modulux</h1>
          <p className="hero-subtitle">道家哲学遇见现代 TypeScript</p>
          <p className="hero-tagline">
            "无名，万物之始也；有名，万物之母也。" — 帛书《道德经》
          </p>
          <div className="hero-actions">
            <a href="https://xinetzone.github.io/DaoMind/guide/getting-started" target="_blank" rel="noreferrer" className="btn btn-primary">
              快速开始
            </a>
            <a href="https://xinetzone.github.io/DaoMind/" target="_blank" rel="noreferrer" className="btn btn-secondary">
              阅读文档
            </a>
            <a href="https://github.com/xinetzone/DaoMind" target="_blank" rel="noreferrer" className="btn btn-ghost">
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-number">{s.number}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section section-muted">
        <div className="container">
          <div className="section-header">
            <p className="section-label">核心哲学</p>
            <h2 className="section-title">无名与有名</h2>
            <p className="section-desc">
              以道家宇宙论为基础，构建清晰的类型与值的二元对立统一体系
            </p>
          </div>
          <div className="philosophy">
            <div className="philo-card yin">
              <div className="philo-char">无</div>
              <div className="philo-label">Wúmíng · Nameless</div>
              <div className="philo-title">无名 — 类型空间</div>
              <p className="philo-desc">
                编译期类型定义，零运行时开销。接口、类型别名、泛型约束。
                万物之始，潜在性的根基。
              </p>
            </div>
            <div className="philo-card yang">
              <div className="philo-char">有</div>
              <div className="philo-label">Yǒumíng · Named</div>
              <div className="philo-title">有名 — 值空间</div>
              <p className="philo-desc">
                运行时实例与实现，模块容器、Agent、消息总线。
                万物之母，显化与落地的根基。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <p className="section-label">核心特性</p>
            <h2 className="section-title">为什么选择 DaoMind？</h2>
            <p className="section-desc">融合东方哲学智慧与现代工程实践，构建可持续的模块化系统</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon"><f.Icon size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="section section-muted">
        <div className="container">
          <div className="section-header">
            <p className="section-label">快速开始</p>
            <h2 className="section-title">3 步创建你的第一个项目</h2>
          </div>
          <div className="code-wrapper">
            <div className="code-header">
              <div className="code-dots">
                <div className="code-dot code-dot-r" />
                <div className="code-dot code-dot-y" />
                <div className="code-dot code-dot-g" />
              </div>
              <span className="code-lang">bash</span>
            </div>
            <pre className="code-block">
<span className="code-comment"># 1. 使用脚手架创建项目</span>
{`
`}<span className="code-fn">pnpx</span>{` `}<span className="code-string">create-daomind</span>{` my-app

`}<span className="code-comment"># 2. 进入项目并安装依赖</span>
{`
`}<span className="code-fn">cd</span>{` my-app && `}<span className="code-fn">pnpm</span>{` install

`}<span className="code-comment"># 3. 启动开发服务器</span>
{`
`}<span className="code-fn">pnpm</span>{` dev`}
            </pre>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <p className="section-label">包生态</p>
            <h2 className="section-title">19+ 核心包</h2>
            <p className="section-desc">从基础契约到完整生态，按需引入，零冗余</p>
          </div>
          <div className="packages-grid">
            {packages.map((pkg) => (
              <div key={pkg.name} className="package-card">
                <div className="package-name">{pkg.name}</div>
                <p>{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>
          Built with care by{' '}
          <a href="https://github.com/xinetzone/DaoMind" target="_blank" rel="noreferrer">
            DaoMind Team
          </a>
          {' '}· v2.23.0 · MIT License
        </p>
        <div className="footer-links">
          <a href="https://xinetzone.github.io/DaoMind/" target="_blank" rel="noreferrer">文档站</a>
          <a href="https://xinetzone.github.io/DaoMind/guide/" target="_blank" rel="noreferrer">指南</a>
          <a href="https://xinetzone.github.io/DaoMind/api/" target="_blank" rel="noreferrer">API</a>
          <a href="https://github.com/xinetzone/DaoMind" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </>
  );
}
