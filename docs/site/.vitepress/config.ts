import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'DaoMind & Modulux',
  description: '融合道家哲学与现代 TypeScript 的模块化框架',
  
  // Ignore dead links during build (temporary - until all docs are migrated)
  ignoreDeadLinks: true,
  
  head: [
    ['link', { rel: 'icon', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#3B4EAC' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'DaoMind & Modulux' }],
    ['meta', { name: 'og:description', content: '融合道家哲学与现代 TypeScript 的模块化框架' }],
    ['meta', { name: 'og:image', content: '/logo.png' }],
  ],
  
  lang: 'zh-CN',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '文档', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' },
      {
        text: '资源',
        items: [
          { text: '视频教程', link: '/videos/' },
          { text: '最佳实践', link: '/guides/best-practices' },
          { text: 'FAQ', link: '/faq' },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/xinetzone/DaoMind' },
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '核心概念', link: '/guide/concepts' },
          ],
        },
        {
          text: '教程',
          items: [
            { text: '第一个示例', link: '/guide/first-example' },
            { text: '理解无名与有名', link: '/guide/nameless-named' },
            { text: '创建模块', link: '/guide/creating-modules' },
            { text: 'Agent 系统', link: '/guide/agents' },
          ],
        },
      ],
      '/api/': [
        {
          text: '核心包',
          items: [
            { text: '@daomind/nothing', link: '/api/nothing' },
            { text: '@daomind/anything', link: '/api/anything' },
            { text: '@daomind/agents', link: '/api/agents' },
          ],
        },
        {
          text: '功能包',
          items: [
            { text: '@modulux/qi', link: '/api/qi' },
            { text: '@daomind/verify', link: '/api/verify' },
            { text: '@daomind/monitor', link: '/api/monitor' },
          ],
        },
      ],
      '/examples/': [
        {
          text: '入门示例',
          items: [
            { text: 'Hello World', link: '/examples/hello-world' },
            { text: 'Counter', link: '/examples/counter' },
            { text: 'Todo List', link: '/examples/todo-list' },
          ],
        },
        {
          text: '中级示例',
          items: [
            { text: '用户管理', link: '/examples/user-management' },
            { text: '任务管理器', link: '/examples/task-manager' },
            { text: '聊天应用', link: '/examples/chat-app' },
          ],
        },
        {
          text: '高级示例',
          items: [
            { text: '项目管理', link: '/examples/project-management' },
            { text: '多 Agent 系统', link: '/examples/multi-agent' },
            { text: '知识图谱', link: '/examples/knowledge-graph' },
          ],
        },
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xinetzone/DaoMind' },
    ],
    
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2026 DaoMind Team',
    },
    
    search: {
      provider: 'local',
    },
    
    editLink: {
      pattern: 'https://github.com/xinetzone/DaoMind/edit/enter-main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
    
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    },
  },
  
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'DaoMind & Modulux' }],
    ['meta', { property: 'og:description', content: '融合道家哲学与现代 TypeScript 的模块化框架' }],
  ],
});
