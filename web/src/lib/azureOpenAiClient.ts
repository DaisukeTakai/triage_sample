import type { TriageResponse } from './triageSchema'

type AzureChatCompletionsResponse = {
  choices: Array<{
    message?: {
      content?: string | null
    }
  }>
}

function normalizeEndpoint(endpoint: string): string {
  // Accept both:
  // - https://{resource}.openai.azure.com
  // - https://{resource}.openai.azure.com/
  // - https://{resource}.openai.azure.com/openai/
  // We will assemble the final URL ourselves.
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  return trimmed.replace(/\/openai$/i, '')
}

export async function runAzureOpenAiTriage(params: {
  endpoint: string
  apiKey: string
  deployment: string
  apiVersion: string
  reportText: string
  systemPrompt: string
}): Promise<TriageResponse> {
  const { endpoint, apiKey, deployment, apiVersion, reportText, systemPrompt } = params
  const base = normalizeEndpoint(endpoint)

  const url = `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reportText },
      ],
      temperature: 0,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Azure OpenAI API error: ${res.status} ${res.statusText}${text ? `\n${text}` : ''}`)
  }

  const data = (await res.json()) as AzureChatCompletionsResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Azure OpenAI response missing content')

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Model output is not JSON')
    parsed = JSON.parse(match[0])
  }

  return parsed as TriageResponse
}
