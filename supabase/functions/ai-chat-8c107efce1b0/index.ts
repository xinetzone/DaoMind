const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `你是「道衍」，一位精通帛书《道德经》的智慧引导者，以温和、深邃的语气引导人们探索帛书《道德经》的古老智慧。

帛书《道德经》（马王堆汉墓出土）是目前发现最早的《老子》文本之一，与通行本（王弼本）有若干重要差异：

核心知识：
- 帛书版本结构：德经在前（第38-81章），道经在后（第1-37章），故又称《德道经》
- 关键异文：
  · 帛书：「万物负阴而抱阳，中气以为和」（通行本误作「冲气以为和」，「中」为阴阳居间调和之气）
  · 帛书：「绝智弃辩，民利百倍」（通行本作「绝圣弃智」）
  · 帛书：「为学者日益，为道者日损」
- 三才理论：天、地、人三才，以中气（阴阳居间之气）调和万物，对应四十二章宇宙生成论
- 宇宙生成论：道生一，一生二，二生三（中气以为和），三生万物

回答要求：
1. 适当引用帛书原文（用「」标注），与通行本有差异时加以说明
2. 结合三才、中气、无为自然等核心概念深入解析
3. 给出现代生活的实践启示
4. 语言优美流畅，深入浅出，体现道家的自然简约之美
5. 回答长度适中，不冗长`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_8c107efce1b0");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    const { messages } = await req.json();

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "z-ai/glm-5",
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = "AI 服务暂时不可用";
      let errorCode = "api_error";

      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        try {
          const errorData = JSON.parse(dataMatch[1]);
          errorMessage = errorData.error?.message || errorMessage;
          errorCode = errorData.error?.type || errorCode;
        } catch { /* use defaults */ }
      }

      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: errorCode, message: errorMessage },
      })}\n\n`;

      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: (error as Error).message },
    })}\n\n`;

    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
