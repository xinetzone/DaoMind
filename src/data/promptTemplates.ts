export interface PromptTemplate {
  id: string
  category: string
  title: string
  prompt: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // 解读
  {
    id: 'interp-1',
    category: '解读',
    title: '原文白话',
    prompt: '请用现代白话文解读「」这句话的含义，并说明其在帛书与通行本中的异同。',
  },
  {
    id: 'interp-2',
    category: '解读',
    title: '章节精解',
    prompt: '请深入解读《道德经》第　章，分析其核心哲学思想与语言结构。',
  },
  {
    id: 'interp-3',
    category: '解读',
    title: '字义考证',
    prompt: '「」这个字在先秦文献中有哪些含义？在《道德经》语境下应如何理解？',
  },
  {
    id: 'interp-4',
    category: '解读',
    title: '帛书对勘',
    prompt: '帛书甲本、乙本与王弼本在「」这一段有何差异？这些差异对理解有何影响？',
  },
  // 应用
  {
    id: 'apply-1',
    category: '应用',
    title: '现代实践',
    prompt: '「无为而治」的道家理念如何在现代管理与领导力中落地应用？请给出具体案例。',
  },
  {
    id: 'apply-2',
    category: '应用',
    title: '心理健康',
    prompt: '从《道德经》的角度，如何面对现代生活中的焦虑与压力？',
  },
  {
    id: 'apply-3',
    category: '应用',
    title: '人际关系',
    prompt: '道家「水善利万物而不争」的思想，对处理人际关系有哪些启示？',
  },
  {
    id: 'apply-4',
    category: '应用',
    title: '决策智慧',
    prompt: '面对重要决策时，如何运用「知常容」的道家智慧保持清醒判断？',
  },
  // 比较
  {
    id: 'comp-1',
    category: '比较',
    title: '儒道对比',
    prompt: '儒家的「仁」与道家的「道」在世界观上有哪些根本差异与相通之处？',
  },
  {
    id: 'comp-2',
    category: '比较',
    title: '东西哲学',
    prompt: '《道德经》的「无为」思想与斯多葛哲学的「顺应自然」有哪些异同？',
  },
  {
    id: 'comp-3',
    category: '比较',
    title: '版本比较',
    prompt: '请比较郭店楚简、马王堆帛书与通行本《道德经》在结构与内容上的主要差异。',
  },
  // 创作
  {
    id: 'create-1',
    category: '创作',
    title: '现代诠释',
    prompt: '请以道家哲学为基础，写一段关于「顺势而为」的现代语境短文（200字）。',
  },
  {
    id: 'create-2',
    category: '创作',
    title: '提问启发',
    prompt: '基于《道德经》的智慧，为我生成5个关于「　」主题的深度思考问题。',
  },
  {
    id: 'create-3',
    category: '创作',
    title: '场景对话',
    prompt: '请模拟老子与一位现代企业家的对话，探讨「柔弱胜刚强」在商业竞争中的应用。',
  },
]

export const TEMPLATE_CATEGORIES = ['解读', '应用', '比较', '创作'] as const
