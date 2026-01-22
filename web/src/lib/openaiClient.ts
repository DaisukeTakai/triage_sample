import type { TriageResponse } from './triageSchema'

type OpenAIChatResponse = {
  choices: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export async function runOpenAiTriage(params: {
  apiKey: string
  reportText: string
  model: string
  systemPrompt: string
}): Promise<TriageResponse> {
  const { apiKey, reportText, model, systemPrompt } = params
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reportText },
      ],
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}${text ? `\n${text}` : ''}`)
  }

  const data = (await res.json()) as OpenAIChatResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI response missing content')

  // Expect a pure JSON string (we enforce in prompt)
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    // fallback: extract JSON block
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Model output is not JSON')
    parsed = JSON.parse(match[0])
  }

  return parsed as TriageResponse
}
