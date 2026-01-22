import { useMemo, useState } from 'react'
import type { TriageResponse, UrgencyLevel } from './lib/triageSchema'
import { isTriageResponse, urgencyLabels } from './lib/triageSchema'
import { runDummyTriage } from './lib/dummyProtocol'
import { runAzureOpenAiTriage } from './lib/azureOpenAiClient'
import { systemPrompt } from './lib/systemPrompt'
import './app-ui.css'

function urgencyToColor(urgency: UrgencyLevel): { bg: string; fg: string; border: string } {
  switch (urgency) {
    case 'red':
      return { bg: '#B00020', fg: '#FFFFFF', border: '#7F0016' }
    case 'orange':
      return { bg: '#C2410C', fg: '#FFFFFF', border: '#7C2D12' }
    case 'yellow':
      return { bg: '#B45309', fg: '#111827', border: '#92400E' }
    case 'green':
      return { bg: '#065F46', fg: '#ECFDF5', border: '#064E3B' }
    case 'white':
      return { bg: '#F3F4F6', fg: '#111827', border: '#D1D5DB' }
  }
}

function App() {
  const [azureEndpoint, setAzureEndpoint] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [deployment, setDeployment] = useState('gpt-5.2')
  const [apiVersion, setApiVersion] = useState('2024-02-15-preview')
  const [reportText, setReportText] = useState('')
  const [mode, setMode] = useState<'dummy' | 'azure-openai'>('dummy')
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<TriageResponse | null>(null)
  const [isDebugOpen, setIsDebugOpen] = useState(false)

  const canRun = useMemo(() => {
    if (!reportText.trim()) return false
    if (mode === 'azure-openai') {
      if (!azureEndpoint.trim()) return false
      if (!deployment.trim()) return false
      if (!apiVersion.trim()) return false
      if (!apiKey.trim()) return false
    }
    return true
  }, [apiKey, apiVersion, azureEndpoint, deployment, mode, reportText])

  async function onRun(): Promise<void> {
    setStatus('running')
    setErrorMessage(null)
    setResult(null)

    try {
      if (mode === 'dummy') {
        const r = runDummyTriage(reportText)
        setResult(r)
        setStatus('success')
        return
      }

      const r = await runAzureOpenAiTriage({
        endpoint: azureEndpoint,
        apiKey,
        deployment,
        apiVersion,
        reportText,
        systemPrompt,
      })
      if (!isTriageResponse(r)) {
        throw new Error('Model output did not match expected schema.')
      }
      setResult(r)
      setStatus('success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErrorMessage(msg)
      setStatus('error')
    }
  }

  const urgency = result?.result.urgency
  const urgencyColor = urgency ? urgencyToColor(urgency) : null

  return (
    <div className="appShell">
      <header style={{ marginBottom: 16 }}>
        <h1 className="appTitle">緊急度判定AI支援（試作）</h1>
        <div className="disclaimer">
          <strong>免責 / 注意:</strong> これは試作であり医療判断の代替ではありません。緊急時は<strong>119番</strong>を優先してください。
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <section className="paperCard">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span>モード</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as 'dummy' | 'azure-openai')}>
                <option value="dummy">ダミー（ローカル判定）</option>
                <option value="azure-openai">Azure OpenAI（JSONフロー生成）</option>
              </select>
            </label>
            {mode === 'azure-openai' && (
              <>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>Deployment</span>
                  <input
                    value={deployment}
                    onChange={(e) => setDeployment(e.target.value)}
                    placeholder="gpt-5.2"
                    style={{ width: 160 }}
                  />
                </label>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>api-version</span>
                  <input
                    value={apiVersion}
                    onChange={(e) => setApiVersion(e.target.value)}
                    placeholder="2024-02-15-preview"
                    style={{ width: 180 }}
                  />
                </label>
              </>
            )}
          </div>

          {mode === 'azure-openai' && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Azure OpenAI Endpoint（例: https://xxxx.openai.azure.com）
              </label>
              <input
                value={azureEndpoint}
                onChange={(e) => setAzureEndpoint(e.target.value)}
                placeholder="https://xxxx.openai.azure.com"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              />

              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, marginTop: 10 }}>
                Azure OpenAI API Key（このブラウザ内でのみ使用 / 保存しません）
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Azure OpenAI Key"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
              />
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>通報内容（テキスト）</label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={7}
              placeholder="例: 70代男性。突然、胸が痛い。冷や汗。会話はできる。"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onRun}
              disabled={!canRun || status === 'running'}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #111827',
                background: canRun ? '#111827' : '#6b7280',
                color: '#ffffff',
                cursor: canRun ? 'pointer' : 'not-allowed',
              }}
            >
              {status === 'running' ? '判定中…' : '判定'}
            </button>
            <button
              onClick={() => {
                setResult(null)
                setErrorMessage(null)
                setStatus('idle')
              }}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff' }}
            >
              クリア
            </button>
          </div>

          {status === 'error' && errorMessage && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2' }}>
              <strong>エラー:</strong>
              <pre style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{errorMessage}</pre>
            </div>
          )}
        </section>

        {result && urgency && urgencyColor && (
          <section className="paperCard resultCard" style={{ border: `2px solid ${urgencyColor.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  className="stamp"
                  style={
                    {
                      ['--stampBg' as any]: urgencyColor.bg,
                      ['--stampFg' as any]: urgencyColor.fg,
                      ['--stampBorder' as any]: urgencyColor.border,
                    } as React.CSSProperties
                  }
                  aria-label={`緊急度: ${urgencyLabels[urgency]}`}
                >
                  <span className="stampLabel">URGENCY</span>
                  <span className="stampValue">{urgencyLabels[urgency]}</span>
                </span>
                <span style={{ fontWeight: 700 }}>推奨:</span>
                <span>{result.result.recommendedAction}</span>
              </div>
            </div>
            <p style={{ marginTop: 10, marginBottom: 0 }}>{result.result.summary}</p>
          </section>
        )}

        {result && (
          <section className="paperCard">
            <h2 style={{ marginTop: 0, fontSize: 18 }}>判定フロー（可視化）</h2>
            <ol className="timeline">
              {result.result.steps.map((s, idx) => (
                <li key={s.id} className="timelineItem">
                  <div className="timelineNode" aria-hidden="true">
                    {idx + 1}
                  </div>
                  <div className="timelineCard">
                    <h3 className="timelineQ">{s.question}</h3>
                    <div className="timelineMeta">
                      <div className="timelineRow">
                        <div className="timelineKey">根拠</div>
                        <p className="timelineVal">{s.evidence}</p>
                      </div>
                      <div className="timelineRow">
                        <div className="timelineKey">判断</div>
                        <p className="timelineVal">{s.decision}</p>
                      </div>
                      <div className="timelineRow">
                        <div className="timelineKey">次</div>
                        <p className="timelineVal">{s.next ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => setIsDebugOpen((v) => !v)}
                style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #d1d5db', background: '#ffffff' }}
                aria-expanded={isDebugOpen}
              >
                {isDebugOpen ? 'JSONを隠す' : 'JSONを表示'}
              </button>
            </div>
            {isDebugOpen && (
              <pre className="debugPre">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </section>
        )}
      </div>

      <footer style={{ marginTop: 16, color: '#6b7280', fontSize: 12 }}>
        <div>APIキーは保存しません（ブラウザ入力のみ）。</div>
      </footer>
    </div>
  )
}

export default App
