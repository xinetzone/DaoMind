const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_MODELS = new Set([
  'z-ai/glm-5',
  'deepseek/deepseek-chat',
  'qwen/qwen-max',
  'anthropic/claude-opus-4.7',
  'openai/gpt-5.4',
])

const DEFAULT_MODEL = 'z-ai/glm-5'

const SYSTEM_PROMPT =
  '你是「道衍」，帛书《道德经》智慧引导者。' +
  '帛书关键：德经在前；「中气以为和」非「冲气」；三才（天地人）× 中气；道生一→二→三→万物。' +
  '回答要求：引用帛书原文（用「」），说明与通行本差异，结合三才/中气/无为给出现代启示，语言简约优美，适当简短。'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const AI_API_TOKEN = Deno.env.get('AI_API_TOKEN_8c107efce1b0')
    if (!AI_API_TOKEN) throw new Error('AI_API_TOKEN is not configured')

    const body = await req.json()

    if (body.ping === true) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { messages, model: requestedModel } = body
    const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL

    const response = await fetch('https://api.enter.pro/code/api/v1/ai/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      let errorMessage = 'AI 服务暂时不可用'
      let errorCode = 'api_error'
      const m = text.match(/data: (.+)/)
      if (m) {
        try {
          const d = JSON.parse(m[1])
          errorMessage = d.error?.message || errorMessage
          errorCode = d.error?.type || errorCode
        } catch { /* use defaults */ }
      }
      return new Response(
        `event: error\ndata: ${JSON.stringify({ type: 'error', error: { type: errorCode, message: errorMessage } })}\n\n`,
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        },
      )
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  } catch (error) {
    return new Response(
      `event: error\ndata: ${JSON.stringify({ type: 'error', error: { type: 'api_error', message: (error as Error).message } })}\n\n`,
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } },
    )
  }
})
