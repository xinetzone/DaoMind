Deno.serve(async (req) => {
  // Simple auth check via header
  const auth = req.headers.get('x-secret-key')
  if (auth !== 'daomind-push-2026') {
    return new Response('Unauthorized', { status: 401 })
  }

  const { secret } = await req.json()
  let value = ''
  if (secret === 'GITHUB_PAT') {
    value = Deno.env.get('GITHUB_PAT') || ''
  } else if (secret === 'NPM_TOKEN') {
    value = Deno.env.get('NPM_TOKEN') || ''
  }

  return new Response(JSON.stringify({ value }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
