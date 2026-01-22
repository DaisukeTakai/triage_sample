export type UrgencyLevel = 'red' | 'orange' | 'yellow' | 'green' | 'white'

export type DecisionStep = {
  /** Stable key for rendering */
  id: string
  /** e.g. "Q6-1 呼びかけても反応がないですか？" */
  question: string
  /** Evidence from input text and/or protocol snippet (dummy for prototype) */
  evidence: string
  /** What was concluded at this step */
  decision: string
  /** Next node label, or null if finished */
  next: string | null
  /** Optional urgency reached at this step */
  urgencyAtThisStep?: UrgencyLevel
}

export type TriageResult = {
  urgency: UrgencyLevel
  recommendedAction: string
  summary: string
  /** The ordered, visible decision flow */
  steps: DecisionStep[]
  /** Additional cautions */
  cautions: string[]
}

export type TriageResponse = {
  version: '0.1'
  protocol: {
    name: string
    note: string
  }
  input: {
    reportText: string
  }
  result: TriageResult
}

export const urgencyLabels: Record<UrgencyLevel, string> = {
  red: '赤：緊急',
  orange: '橙：至急',
  yellow: '黄：注意',
  green: '緑：経過観察',
  white: '白：判定保留',
}

export const urgencyActions: Record<UrgencyLevel, string> = {
  red: '119通報・転送',
  orange: 'いますぐ受診（救急車以外で）',
  yellow: 'これから受診（通常の受付時間を待たず自力受診）',
  green: '通常の受付時間に受診',
  white: '受診不要・経過観察（不安なら相談）',
}

export function isTriageResponse(value: unknown): value is TriageResponse {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.version !== '0.1') return false
  if (!v.result || typeof v.result !== 'object') return false
  const r = v.result as Record<string, unknown>
  if (typeof r.urgency !== 'string') return false
  if (!['red', 'orange', 'yellow', 'green', 'white'].includes(r.urgency)) return false
  if (!Array.isArray(r.steps)) return false
  return true
}
