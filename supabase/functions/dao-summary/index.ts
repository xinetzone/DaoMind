const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT =
  '你是对话摘要助手。请从用户提供的对话内容中提取核心主题，严格返回 JSON 格式，不要任何解释。' +
  '格式：{"title":"标题","summary":"摘要"} ' +
  '要求：title 为对话核心主题，10字以内；summary 为一句话概括，28字以内。仅返回纯 JSON。'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const AI_API_TOKEN = Deno.env.get('AI_API_TOKEN_8c107efce1b0')
    if (!AI_API_TOKEN) throw new Error('AI_API_TOKEN is not configured')

    const { messages } = await req.json() as {
      messages: Array<{ role: string; content: string }>
    }
    if (!messages || messages.length === 0) throw new Error('messages is empty')

    // Use last 4 messages at most
    const context = messages
      .slice(-4)
      .map((m) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 300)}`)
      .join('\n')

    const response = await fetch('https://api.enter.pro/code/api/v1/ai/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'z-ai/glm-5',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: context }],
        stream: false,
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      throw new Error(`AI API error: ${t.slice(0, 200)}`)
    }

    const data = await response.json() as {
      content?: Array<{ type: string; text?: string }>
    }

    let rawText = ''
    if (Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text' && block.text) rawText += block.text
      }
    }

    // Extract JSON
    const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0]) as { title?: string; summary?: string }

    const title = typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim().slice(0, 15)
      : '新对话'
    const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim().slice(0, 40)
      : ''

    return new Response(JSON.stringify({ title, summary }), {
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
