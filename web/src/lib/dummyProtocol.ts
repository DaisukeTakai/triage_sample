import type { TriageResponse, UrgencyLevel } from './triageSchema'
import { urgencyActions } from './triageSchema'

const CPA_KEYWORDS = ['呼吸がない', '息をしていない', '心肺停止', '脈がない', '冷たくなっている', '水没']
const UNRESPONSIVE_KEYWORDS = ['反応がない', '意識がない', '呼びかけても返事がない']
const DYSPNEA_KEYWORDS = ['息苦しい', '息が苦しい', 'ハアハア', '呼吸が苦しい', '呼吸困難']
const CHEST_PAIN_KEYWORDS = ['胸が痛い', '胸痛', '胸の痛み', '胸が締め付けられる']

function hasAny(text: string, keywords: string[]): boolean {
  const t = text.replace(/\s+/g, '')
  return keywords.some((k) => t.includes(k.replace(/\s+/g, '')))
}

/**
 * PROTOTYPE ONLY
 * - This is a dummy, "protocol-like" flow based on the visible common gating rules.
 * - Replace with the real protocol once you have the full document.
 */
export function runDummyTriage(reportText: string): TriageResponse {
  const steps: TriageResponse['result']['steps'] = []

  // Q2: CPA keyword short-circuit
  const cpa = hasAny(reportText, CPA_KEYWORDS)
  steps.push({
    id: 'q2-cpa',
    question: 'Q2: 心肺停止を疑うキーワードはありますか？（ダミー判定）',
    evidence: cpa
      ? `入力に「${CPA_KEYWORDS.find((k) => reportText.includes(k)) ?? '該当キーワード'}」が含まれるため`
      : '入力から明確な心肺停止キーワードは検出されませんでした',
    decision: cpa ? '心肺停止の可能性 → 直ちに119' : '心肺停止の可能性は低い → 次へ',
    next: cpa ? 'END' : 'Q6-1',
    urgencyAtThisStep: cpa ? 'red' : undefined,
  })
  if (cpa) {
    return {
      version: '0.1',
      protocol: {
        name: '消防庁プロトコール風（ダミー）',
        note: '試作のため詳細プロトコール本文は未反映です。',
      },
      input: { reportText },
      result: {
        urgency: 'red',
        recommendedAction: urgencyActions.red,
        summary: '心肺停止が疑われる表現があるため、緊急（赤）としました。',
        steps,
        cautions: ['これは試作です。緊急時は119番を優先してください。'],
      },
    }
  }

  // Q6-1 response
  const unresp = hasAny(reportText, UNRESPONSIVE_KEYWORDS)
  steps.push({
    id: 'q6-1',
    question: 'Q6-1: 呼びかけても反応がありませんか？（ダミー判定）',
    evidence: unresp
      ? `入力に「${UNRESPONSIVE_KEYWORDS.find((k) => reportText.includes(k)) ?? '反応がない'}」が含まれるため`
      : '入力から「反応がない/意識がない」等は検出されませんでした',
    decision: unresp ? '反応なし → 直ちに119' : '反応あり → 次へ',
    next: unresp ? 'END' : 'Q6-3',
    urgencyAtThisStep: unresp ? 'red' : undefined,
  })
  if (unresp) {
    return {
      version: '0.1',
      protocol: {
        name: '消防庁プロトコール風（ダミー）',
        note: '試作のため詳細プロトコール本文は未反映です。',
      },
      input: { reportText },
      result: {
        urgency: 'red',
        recommendedAction: urgencyActions.red,
        summary: '反応がない表現があるため、緊急（赤）としました。',
        steps,
        cautions: ['これは試作です。緊急時は119番を優先してください。'],
      },
    }
  }

  // Q6-3 dyspnea
  const dyspnea = hasAny(reportText, DYSPNEA_KEYWORDS)
  steps.push({
    id: 'q6-3',
    question: 'Q6-3: 息が苦しいですか？（ダミー判定）',
    evidence: dyspnea
      ? `入力に「${DYSPNEA_KEYWORDS.find((k) => reportText.includes(k)) ?? '息が苦しい'}」が含まれるため`
      : '入力から明確な呼吸苦キーワードは検出されませんでした',
    decision: dyspnea ? '呼吸困難の可能性 → 準緊急（橙）' : '呼吸困難の可能性は低い → 次へ',
    next: dyspnea ? 'END' : 'Q7(主訴別)',
    urgencyAtThisStep: dyspnea ? 'orange' : undefined,
  })
  if (dyspnea) {
    return {
      version: '0.1',
      protocol: {
        name: '消防庁プロトコール風（ダミー）',
        note: '試作のため詳細プロトコール本文は未反映です。',
      },
      input: { reportText },
      result: {
        urgency: 'orange',
        recommendedAction: urgencyActions.orange,
        summary: '呼吸苦を示す表現があるため、準緊急（橙）としました。',
        steps,
        cautions: ['これは試作です。症状が強い/増悪する場合は119や医療機関へ。'],
      },
    }
  }

  // Q7 dummy: chest pain heuristic
  const chestPain = hasAny(reportText, CHEST_PAIN_KEYWORDS)
  const finalUrgency: UrgencyLevel = chestPain ? 'yellow' : 'green'
  steps.push({
    id: 'q7',
    question: 'Q7: 主訴別（簡易ダミー）',
    evidence: chestPain
      ? '入力から「胸痛」関連の表現を検出'
      : '重大キーワードは少なく、一般相談レベルと推定',
    decision: chestPain ? '胸痛の可能性 → 低緊急（黄）' : '非緊急寄り → 緑',
    next: 'END',
    urgencyAtThisStep: finalUrgency,
  })

  return {
    version: '0.1',
    protocol: {
      name: '消防庁プロトコール風（ダミー）',
      note: '試作のため詳細プロトコール本文は未反映です。',
    },
    input: { reportText },
    result: {
      urgency: finalUrgency,
      recommendedAction: urgencyActions[finalUrgency],
      summary: chestPain
        ? '胸痛の可能性があるため、低緊急（黄）としました。'
        : '緊急所見が少ないため、非緊急（緑）としました。',
      steps,
      cautions: ['これは試作です。実際の運用では公式プロトコールに置き換えてください。'],
    },
  }
}
