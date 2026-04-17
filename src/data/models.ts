export interface AIModel {
  id: string
  name: string
  vendor: string
  desc: string
  badge?: string
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'z-ai/glm-5',
    name: 'GLM-5',
    vendor: '智谱',
    desc: '道衍默认，优秀中文理解与生成',
    badge: '默认',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    vendor: '深度求索',
    desc: '强推理能力，擅长深度分析',
  },
  {
    id: 'qwen/qwen-max',
    name: 'Qwen Max',
    vendor: '阿里云',
    desc: '通义千问，广博中文知识储备',
  },
  {
    id: 'anthropic/claude-opus-4.7',
    name: 'Claude Opus 4.7',
    vendor: 'Anthropic',
    desc: '最强推理与复杂任务处理，适合深度道德哲学分析',
    badge: 'New',
  },
  {
    id: 'openai/gpt-5.4',
    name: 'GPT 5.4',
    vendor: 'OpenAI',
    desc: '前沿综合能力，复杂推理与高质量输出',
    badge: 'New',
  },
]

export const DEFAULT_MODEL_ID = 'z-ai/glm-5'
