import { useState, useEffect } from 'react'

const TYPE_LABELS = { web: 'Web', podcast: 'Podcast', newsletter: 'Newsletter', post: 'Post' }
const BADGE_STYLE = {
  web:         { background: '#e8f4fd', color: '#1a6a9a' },
  podcast:     { background: '#fff0e8', color: '#c05a20' },
  newsletter:  { background: '#eaf0e8', color: '#3a6e2a' },
  post:        { background: '#f0e8f8', color: '#6a3a9a' },
}
const TONE_DESC = {
  executivo:      'direto, denso, sem enrolação — para executivos e board members',
  conversacional: 'amigável e fluido, como uma conversa entre colegas',
  tecnico:        'preciso e técnico, com foco em dados e mecanismos',
}
const STORAGE_KEY = 'curadoria_items_v1'

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function App() {
  const [tab, setTab] = useState('collect')
  const [items, setItems] = useState(loadItems)
  const [type, setType] = useState('web')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [tone, setTone] = useState('executivo')
  const [week, setWeek] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [digest, setDigest] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { saveItems(items) }, [items])

  useEffect(() => {
    if (!week) {
      const now = new Date()
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay() + 1)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      setWeek(`semana de ${fmt(start)} a ${fmt(end)}`)
    }
  }, [])

  function addItem() {
    if (!title.trim()) return
    setItems(prev => [...prev, { id: Date.now(), type, title: title.trim(), note: note.trim() }])
    setTitle('')
    setNote('')
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function clearAll() {
    if (window.confirm(`Remover todos os ${items.length} itens? Esta ação não pode ser desfeita.`)) {
      setItems([])
      setDigest('')
    }
  }

  async function compile() {
    if (items.length === 0) return
    setLoading(true)
    setDigest('')

    const msgs = [
      'Analisando os itens coletados...',
      'Identificando temas e conexões...',
      'Redigindo o digest...',
      'Formatando para WhatsApp...',
    ]
    let idx = 0
    setLoadingMsg(msgs[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length
      setLoadingMsg(msgs[idx])
    }, 2200)

    const itemsFormatted = items.map((it, i) =>
      `[${i + 1}] TIPO: ${TYPE_LABELS[it.type]}\nFONTE/TÍTULO: ${it.title}${it.note ? '\nANOTAÇÃO: ' + it.note : ''}`
    ).join('\n\n')

    const prompt = `Você é um curador experiente de conteúdo para venture capital, tech e healthtech. Seu papel é transformar uma lista de conteúdos coletados ao longo da semana em um digest semanal de altíssima qualidade, formatado para envio via WhatsApp ao board de uma healthtech.

ITENS COLETADOS (${items.length} itens — ${week || 'esta semana'}):
${itemsFormatted}

INSTRUÇÕES:
- Tom: ${TONE_DESC[tone]}
- Comece com um header: "📬 *Digest Semanal — ${week || 'esta semana'}*"
- Escreva uma abertura curta (2–3 linhas) com o "tema da semana" que emerge dos itens
- Organize os itens em seções temáticas (ex: 🤖 IA & Tech, 💊 Healthtech, 💰 VC & Mercado, 📌 Outros)
- Para cada item: título em *negrito*, fonte entre parênteses, 2–4 linhas de síntese comentada com perspectiva de investidor
- Inclua "💡 Por que importa" quando o item tiver relevância estratégica clara
- Feche com 3–5 bullets de "🎯 Sinais da semana" — as principais conclusões que um board member deveria levar
- Use emojis com moderação, apenas no início de seções
- Formato limpo para WhatsApp: *negrito* com asteriscos, sem markdown avançado
- Máximo 600 palavras
- Escreva em português brasileiro`

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await resp.json()
      const text = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || 'Erro: resposta vazia.'
      setDigest(text)
    } catch (e) {
      setDigest('Erro ao conectar com a API. Verifique sua chave e tente novamente.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  function copyDigest() {
    navigator.clipboard.writeText(digest).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const typeCounts = Object.fromEntries(
    Object.keys(TYPE_LABELS).map(t => [t, items.filter(i => i.type === t).length])
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f7', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 0 40px' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '0.5px solid #dde8ef', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 36, background: 'linear-gradient(180deg, #56BBC2, #225379)', borderRadius: 4, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#225379' }}>Curadoria Semanal</div>
            <div style={{ fontSize: 11, color: '#6b8fa6', marginTop: 1 }}>VC · Tech · Healthtech</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {items.length > 0 && (
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#aac4d5', fontSize: 11, cursor: 'pointer', padding: '3px 6px' }}>
                limpar
              </button>
            )}
            <div style={{ background: '#56BBC2', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #dde8ef' }}>
          {['collect', 'compile'].map((t, i) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: 500,
              color: tab === t ? '#225379' : '#6b8fa6', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #56BBC2' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {i === 0 ? 'Coletar' : 'Compilar digest'}
            </button>
          ))}
        </div>

        {/* Collect Panel */}
        {tab === 'collect' && (
          <div style={{ padding: 16, flex: 1 }}>
            {/* Add form */}
            <div style={{ background: '#F4F8FB', borderRadius: 12, padding: 14, border: '0.5px solid #dde8ef', marginBottom: 16 }}>
              <Row label="Tipo">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <Chip key={k} selected={type === k} onClick={() => setType(k)}>{v}</Chip>
                  ))}
                </div>
              </Row>
              <Row label="Título / Link">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addItem()}
                  placeholder="Cole o link ou escreva o título"
                  style={inputStyle}
                />
              </Row>
              <Row label="Sua anotação (opcional)">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="O que achou? Por que é relevante?"
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.5 }}
                />
              </Row>
              <button onClick={addItem} style={addBtnStyle}>Adicionar ao digest</button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b8fa6' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14 }}>Nenhum item ainda.<br />Adicione conteúdos ao longo da semana.</div>
                <div style={{ fontSize: 12, marginTop: 8, color: '#aac4d5' }}>Os itens ficam salvos no navegador.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...items].reverse().map(item => (
                  <div key={item.id} style={{ background: '#fff', border: '0.5px solid #dde8ef', borderRadius: 12, padding: '12px 14px', position: 'relative' }}>
                    <button onClick={() => deleteItem(item.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>×</button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ ...BADGE_STYLE[item.type], fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0, marginTop: 1 }}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#225379', flex: 1, lineHeight: 1.4, paddingRight: 20, wordBreak: 'break-word' }}>
                        {item.title}
                      </div>
                    </div>
                    {item.note && <div style={{ fontSize: 12, color: '#6b8fa6', marginTop: 6, lineHeight: 1.5 }}>{item.note}</div>}
                    <div style={{ fontSize: 11, color: '#aac4d5', marginTop: 6 }}>
                      {new Date(item.id).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compile Panel */}
        {tab === 'compile' && (
          <div style={{ padding: 16, flex: 1 }}>
            {/* Stats */}
            {items.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginBottom: 16 }}>
                <StatCard value={items.length} label="itens coletados" />
                <StatCard value={Object.values(typeCounts).filter(v => v > 0).length} label="tipos de fonte" />
              </div>
            )}

            <div style={{ background: '#F4F8FB', borderRadius: 12, padding: 14, border: '0.5px solid #dde8ef', marginBottom: 16, fontSize: 13, color: '#6b8fa6', lineHeight: 1.6 }}>
              Gera um <strong style={{ color: '#225379' }}>digest semanal</strong> formatado para WhatsApp — curadoria comentada de VC, tech e healthtech para o board da healthtech.
            </div>

            <Row label="Semana de referência">
              <input value={week} onChange={e => setWeek(e.target.value)} placeholder="ex: semana de 23–28 jun" style={inputStyle} />
            </Row>

            <Row label="Tom do digest">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.keys(TONE_DESC).map(t => (
                  <Chip key={t} selected={tone === t} onClick={() => setTone(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Chip>
                ))}
              </div>
            </Row>

            <button onClick={compile} disabled={loading || items.length === 0} style={{
              ...compileBtnStyle,
              opacity: (loading || items.length === 0) ? 0.5 : 1,
              cursor: (loading || items.length === 0) ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Gerando...' : `Gerar digest ↗`}
            </button>

            {items.length === 0 && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#aac4d5', marginTop: 8 }}>
                Adicione itens na aba "Coletar" primeiro.
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: '#F4F8FB', borderRadius: 12, border: '0.5px solid #dde8ef', marginTop: 14 }}>
                <div style={{ width: 18, height: 18, border: '2px solid #B7E7DC', borderTopColor: '#56BBC2', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: '#6b8fa6' }}>{loadingMsg}</div>
              </div>
            )}

            {digest && !loading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6b8fa6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Digest pronto</span>
                  <button onClick={copyDigest} style={{
                    padding: '6px 14px', border: `0.5px solid ${copied ? '#56BBC2' : '#56BBC2'}`,
                    background: copied ? '#56BBC2' : '#fff', color: copied ? '#fff' : '#56BBC2',
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {copied ? 'Copiado ✓' : 'Copiar tudo'}
                  </button>
                </div>
                <div style={{
                  background: '#F4F8FB', border: '0.5px solid #dde8ef', borderRadius: 12,
                  padding: 14, fontSize: 13, lineHeight: 1.8, color: '#225379',
                  whiteSpace: 'pre-wrap', maxHeight: 450, overflowY: 'auto', wordBreak: 'break-word',
                }}>
                  {digest}
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={compile} style={{ flex: 1, padding: '9px', border: '0.5px solid #dde8ef', background: '#fff', color: '#6b8fa6', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                    Regerar
                  </button>
                  <button onClick={() => { setDigest(''); setItems([]); setTab('collect') }} style={{ flex: 1, padding: '9px', border: '0.5px solid #dde8ef', background: '#fff', color: '#6b8fa6', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                    Nova semana
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8fa6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Chip({ selected, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      border: '0.5px solid', transition: 'all 0.15s',
      background: selected ? '#56BBC2' : '#fff',
      color: selected ? '#fff' : '#6b8fa6',
      borderColor: selected ? '#56BBC2' : '#dde8ef',
    }}>
      {children}
    </button>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={{ background: '#F4F8FB', borderRadius: 8, padding: '10px 12px', border: '0.5px solid #dde8ef' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#225379' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b8fa6', marginTop: 2 }}>{label}</div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '0.5px solid #dde8ef',
  borderRadius: 8, fontSize: 14, color: '#225379', background: '#fff', outline: 'none',
}

const addBtnStyle = {
  width: '100%', padding: '11px', background: '#225379', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
}

const compileBtnStyle = {
  width: '100%', padding: '13px', background: '#56BBC2', color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, letterSpacing: '0.2px',
  marginBottom: 4,
}
