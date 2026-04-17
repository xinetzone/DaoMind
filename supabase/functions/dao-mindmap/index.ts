const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MindNode {
  text: string
  children: MindNode[]
}

const EXTRACT_PROMPT =
  '请从以下对话中提取核心主题和子主题，生成思维导图结构。' +
  '严格返回JSON格式，不要任何解释文字。格式: {"text":"根主题","children":[{"text":"子主题","children":[]}]}' +
  '要求: 根主题为对话核心(10字内)，最多3层，每层最多5节点，节点文字简短(8字内)。仅返回纯JSON。'

function validateTree(node: unknown, depth = 0): MindNode {
  if (!node || typeof node !== 'object') return { text: '主题', children: [] }
  const n = node as Record<string, unknown>
  const text = typeof n.text === 'string' && n.text.trim() ? n.text.trim().slice(0, 20) : '主题'
  if (depth >= 3) return { text, children: [] }
  const rawChildren = Array.isArray(n.children) ? n.children : []
  const children = rawChildren.slice(0, 5).map((c: unknown) => validateTree(c, depth + 1))
  return { text, children }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const AI_API_TOKEN = Deno.env.get('AI_API_TOKEN_8c107efce1b0')
    if (!AI_API_TOKEN) throw new Error('AI_API_TOKEN is not configured')

    const { messages } = await req.json() as { messages: Array<{ role: string; content: string }> }
    if (!messages || messages.length === 0) throw new Error('messages is empty')

    // Summarise conversation into a short prompt for topic extraction
    const conversationSummary = messages
      .slice(-12) // last 12 messages max
      .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 200)}`)
      .join('\n')

    const response = await fetch('https://api.enter.pro/code/api/v1/ai/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'z-ai/glm-5',
        system: EXTRACT_PROMPT,
        messages: [{ role: 'user', content: conversationSummary }],
        stream: false,
        max_tokens: 800,
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      throw new Error(`AI API error: ${t.slice(0, 200)}`)
    }

    const data = await response.json() as {
      content?: Array<{ type: string; text?: string }>
    }

    // Extract text content
    let rawText = ''
    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text' && block.text) rawText += block.text
      }
    }

    // Parse JSON from response (strip markdown code fences if present)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])
    const tree = validateTree(parsed)

    return new Response(JSON.stringify({ tree }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
