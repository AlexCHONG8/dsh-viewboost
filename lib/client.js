window.__ModuleLoader__.load({ id: "@dsh-external/viewboost", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
const React = require("react");
const h = React.createElement
// FanBox 同款 feather SVG 图标 (from /tmp/fanbox-repo public/app.js SVG dict)
const VB_ICONS = {
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  maximize: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
}

function vbRpc(name, args) {
  const map = { revealInFinder: 'finder', copyFileToClipboard: 'copyfile' }
  const rn = map[name] || name
  return fetch('/viewboost/' + rn, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(args || {}) }).then((r) => r.json())
}

function vbIcon(name, size) {
  const inner = VB_ICONS[name] || ''
  const s = size || 14
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'
}

function basename(p) {
  if (typeof p !== 'string') return ''
  const seg = p.split('/')
  return seg[seg.length - 1] || p
}

function extOf(p) {
  const b = basename(p)
  const i = b.lastIndexOf('.')
  return i >= 0 ? b.slice(i + 1).toLowerCase() : ''
}

const IMG_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif', 'avif', 'tiff'])
const MD_EXT = new Set(['md', 'markdown', 'mdown', 'mkd'])
const CODE_EXT = new Set(['js', 'jsx', 'ts', 'tsx', 'json', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'css', 'scss', 'sass', 'html', 'xml', 'yaml', 'yml', 'toml', 'sh', 'bash', 'zsh', 'sql', 'rb', 'php', 'swift', 'kt', 'lua', 'vue', 'svelte'])
const TEXT_EXT = new Set(['txt', 'log', 'env', 'ini', 'conf', 'csv', 'tsv'])

function classify(p) {
  const e = extOf(p)
  if (IMG_EXT.has(e)) return 'image'
  if (e === 'pdf') return 'pdf'
  if (e === 'xlsx' || e === 'xls' || e === 'xlsm') return 'xlsx'
  if (e === 'csv' || e === 'tsv') return 'csv'
  if (e === 'docx') return 'docx'
  if (e === 'pptx' || e === 'ppt') return 'pptx'
  if (MD_EXT.has(e)) return 'markdown'
  if (CODE_EXT.has(e)) return 'code'
  if (TEXT_EXT.has(e)) return 'text'
  return 'unknown'
}

function formatSize(n) {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const VENDOR = {
  pdfjs: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs',
  pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs',
  xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
}

const vendorCache = {}
async function loadScript(url, checkGlobal) {
  if (vendorCache[url]) return vendorCache[url]
  if (checkGlobal && typeof window !== 'undefined' && window[checkGlobal]) {
    vendorCache[url] = Promise.resolve(window[checkGlobal])
    return vendorCache[url]
  }
  vendorCache[url] = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = url
    s.async = true
    s.onload = () => resolve(checkGlobal ? window[checkGlobal] : true)
    s.onerror = () => reject(new Error('Failed to load ' + url))
    document.head.appendChild(s)
  })
  return vendorCache[url]
}

function btnStyle(disabled) {
  return {
    background: 'transparent',
    color: 'var(--dsh-text-muted, #888)',
    border: '1px solid var(--dsh-border, #444)',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '2px 10px',
    fontSize: '12px',
    opacity: disabled ? 0.4 : 1,
  }
}

function renderMarkdown(src) {
  const lines = src.split('\n')
  const out = []
  let inCode = false
  let codeBuf = []
  let listItems = []

  function flushList() {
    if (listItems.length === 0) return
    out.push(h('ul', { style: { margin: '6px 0', paddingLeft: '22px' } },
      listItems.map((it) => h('li', { style: { margin: '2px 0' } }, it))
    ))
    listItems = []
  }

  function inlineMd(s) {
    let r = escapeHtml(s)
    r = r.replace(/`([^`]+)`/g, '<code>$1</code>')
    r = r.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    r = r.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    return r
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(h('pre', { style: { background: 'var(--dsh-surface-2, #1e1e1e)', color: 'var(--dsh-text, #e0e0e0)', padding: '10px 12px', borderRadius: '6px', overflow: 'auto', fontSize: '13px', fontFamily: 'ui-monospace, Menlo, monospace', margin: '8px 0' } },
          h('code', null, codeBuf.join('\n'))
        ))
        codeBuf = []
        inCode = false
      } else {
        flushList()
        inCode = true
      }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }
    if (/^\s*$/.test(line)) { flushList(); out.push(h('div', { style: { height: '6px' } })); continue }

    const h6 = line.match(/^######\s+(.*)$/)
    const h5 = line.match(/^#####\s+(.*)$/)
    const h4 = line.match(/^####\s+(.*)$/)
    const h3 = line.match(/^###\s+(.*)$/)
    const h2 = line.match(/^##\s+(.*)$/)
    const h1 = line.match(/^#\s+(.*)$/)
    const hr = line.match(/^---+$/)
    const bq = line.match(/^>\s?(.*)$/)
    const li = line.match(/^[\-\*]\s+(.*)$/)

    if (h1) { flushList(); out.push(h('h1', { dangerouslySetInnerHTML: { __html: inlineMd(h1[1]) }, style: { fontSize: '22px', fontWeight: '700', margin: '14px 0 8px', borderBottom: '1px solid var(--dsh-border, #333)', paddingBottom: '6px' } })); continue }
    if (h2) { flushList(); out.push(h('h2', { dangerouslySetInnerHTML: { __html: inlineMd(h2[1]) }, style: { fontSize: '18px', fontWeight: '700', margin: '12px 0 6px', borderBottom: '1px solid var(--dsh-border, #333)', paddingBottom: '4px' } })); continue }
    if (h3) { flushList(); out.push(h('h3', { dangerouslySetInnerHTML: { __html: inlineMd(h3[1]) }, style: { fontSize: '16px', fontWeight: '600', margin: '10px 0 4px' } })); continue }
    if (h4) { flushList(); out.push(h('h4', { dangerouslySetInnerHTML: { __html: inlineMd(h4[1]) }, style: { fontSize: '15px', fontWeight: '600', margin: '8px 0 4px' } })); continue }
    if (h5) { flushList(); out.push(h('h5', { dangerouslySetInnerHTML: { __html: inlineMd(h5[1]) }, style: { fontSize: '14px', fontWeight: '600', margin: '6px 0 4px' } })); continue }
    if (h6) { flushList(); out.push(h('h6', { dangerouslySetInnerHTML: { __html: inlineMd(h6[1]) }, style: { fontSize: '13px', fontWeight: '600', margin: '6px 0 4px' } })); continue }
    if (hr) { flushList(); out.push(h('hr', { style: { border: 'none', borderTop: '1px solid var(--dsh-border, #333)', margin: '10px 0' } })); continue }
    if (bq) { flushList(); out.push(h('div', { style: { borderLeft: '3px solid var(--dsh-border, #666)', padding: '4px 10px', margin: '6px 0', color: 'var(--dsh-text-muted, #888)' }, dangerouslySetInnerHTML: { __html: inlineMd(bq[1]) } })); continue }
    if (li) { listItems.push(h('span', { dangerouslySetInnerHTML: { __html: inlineMd(li[1]) } })); continue }

    flushList()
    out.push(h('p', { dangerouslySetInnerHTML: { __html: inlineMd(line) }, style: { margin: '6px 0', lineHeight: '1.55' } }))
  }
  flushList()
  return h('div', { className: 'vb-md', style: { fontSize: '14px', color: 'var(--dsh-text, #e0e0e0)' } }, out)
}

function CodeBlock({ text, lang }) {
  const tokens = text.split('\n').map((ln, i) => {
    const num = String(i + 1).padStart(4, ' ')
    return h('div', { key: i, style: { display: 'flex' } },
      h('span', { style: { width: '44px', color: 'var(--dsh-text-muted, #888)', userSelect: 'none', textAlign: 'right', paddingRight: '12px', flexShrink: 0 } }, num),
      h('span', { style: { whiteSpace: 'pre', flex: 1 } }, ln || ' ')
    )
  })
  return h('div', {
    style: {
      background: 'var(--dsh-surface-2, #1e1e1e)',
      color: 'var(--dsh-text, #e0e0e0)',
      borderRadius: '6px',
      overflow: 'auto',
      fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
      fontSize: '12.5px',
      maxHeight: '60vh',
      margin: '4px 0',
      padding: '8px 0',
    }
  },
    lang ? h('div', { style: { padding: '0 12px 6px', color: 'var(--dsh-text-muted, #888)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' } }, lang) : null,
    tokens
  )
}

function PdfView({ path }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  const canvasRef = React.useRef(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const docRef = React.useRef(null)

  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    setPage(1)
    loadScript(VENDOR.pdfjs, 'pdfjsLib').then(() => {
      const pdfjsLib = window.pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = VENDOR.pdfjsWorker
      return vbRpc("thumb", { path }).then((r) => {
        if (!alive) return
        if (!r || !r.ok) { setState({ kind: 'error', error: (r && r.error) || 'load failed' }); return }
        const data = atob(r.dataUrl.split(',')[1])
        const bytes = new Uint8Array(data.length)
        for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i)
        return pdfjsLib.getDocument({ data: bytes }).promise.then((d) => {
          if (!alive) return
          docRef.current = d
          setTotalPages(d.numPages)
          setState({ kind: 'ok' })
        })
      })
    }).catch((e) => {
      if (alive) setState({ kind: 'error', error: e.message || 'PDF.js load failed' })
    })
    return () => {
      alive = false
      if (docRef.current) try { docRef.current.destroy() } catch (_) {}
    }
  }, [path])

  React.useEffect(() => {
    if (state.kind !== 'ok' || !docRef.current || !canvasRef.current) return
    let renderTask = null
    let alive = true
    docRef.current.getPage(page).then((p) => {
      if (!alive || !canvasRef.current) return
      const viewport = p.getViewport({ scale: 1.3 })
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height
      renderTask = p.render({ canvasContext: ctx, viewport })
      return renderTask.promise
    }).catch((e) => {
      if (alive && e && e.name !== 'RenderingCancelledException') console.error('pdf render', e)
    })
    return () => {
      alive = false
      if (renderTask) try { renderTask.cancel() } catch (_) {}
    }
  }, [state, page])

  if (state.kind === 'loading') return h('div', { style: { padding: '40px', color: 'var(--dsh-text-muted, #888)', textAlign: 'center' } }, '⏳ PDF 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '20px', color: '#f88' } }, '⚠ ' + state.error)

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' } },
    h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
      h('button', { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page <= 1, style: btnStyle(page <= 1) }, '← 上一页'),
      h('span', { style: { fontSize: '13px', color: 'var(--dsh-text-muted, #888)' } }, page + ' / ' + totalPages),
      h('button', { onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages, style: btnStyle(page >= totalPages) }, '下一页 →')
    ),
    h('div', { style: { background: '#fff', padding: '8px', borderRadius: '4px', overflow: 'auto', maxWidth: '100%', maxHeight: '70vh' } },
      h('canvas', { ref: canvasRef })
    )
  )
}

function XlsxView({ path }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  const [activeIdx, setActiveIdx] = React.useState(0)

  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    setActiveIdx(0)
    loadScript(VENDOR.xlsx, 'XLSX').then(() => {
      return vbRpc("thumb", { path }).then((r) => {
        if (!alive) return
        if (!r || !r.ok) { setState({ kind: 'error', error: (r && r.error) || 'load failed' }); return }
        const bytes = Uint8Array.from(atob(r.dataUrl.split(',')[1]), (c) => c.charCodeAt(0))
        const wb = window.XLSX.read(bytes, { type: 'array' })
        const sheets = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name]
          const html = window.XLSX.utils.sheet_to_html(ws, { editable: false })
          const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 })
          return { name, html, rows }
        })
        if (alive) setState({ kind: 'ok', sheets })
      })
    }).catch((e) => {
      if (alive) setState({ kind: 'error', error: e.message || 'XLSX load failed' })
    })
    return () => { alive = false }
  }, [path])

  if (state.kind === 'loading') return h('div', { style: { padding: '40px', color: 'var(--dsh-text-muted, #888)', textAlign: 'center' } }, '⏳ Excel 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '20px', color: '#f88' } }, '⚠ ' + state.error)

  const active = state.sheets[activeIdx]
  if (!active) return h('div', null, 'Empty workbook')

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
    state.sheets.length > 1 ? h('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid var(--dsh-border, #333)', paddingBottom: '4px' } },
      state.sheets.map((s, i) => h('button', {
        key: i,
        onClick: () => setActiveIdx(i),
        style: {
          background: i === activeIdx ? 'var(--dsh-surface-2, #2a2a2a)' : 'transparent',
          color: i === activeIdx ? 'var(--dsh-text, #e0e0e0)' : 'var(--dsh-text-muted, #888)',
          border: '1px solid var(--dsh-border, #444)',
          borderRadius: '4px',
          cursor: 'pointer',
          padding: '2px 10px',
          fontSize: '12px',
        }
      }, s.name + ' (' + s.rows.length + ')'))
    ) : null,
    h('div', { style: { overflow: 'auto', maxHeight: '70vh', border: '1px solid var(--dsh-border, #333)', borderRadius: '4px' } },
      h('div', { dangerouslySetInnerHTML: { __html: active.html.replace(/<table/g, '<table style="border-collapse:collapse;font-size:12px"').replace(/<td/g, '<td style="border:1px solid var(--dsh-border, #444);padding:3px 6px"').replace(/<th/g, '<th style="border:1px solid var(--dsh-border, #444);padding:3px 6px;background:var(--dsh-surface-2, #2a2a2a);text-align:left"') } })
    )
  )
}

function CsvView({ path }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    vbRpc("read", { path }).then((r) => {
      if (!alive) return
      if (!r || !r.ok) { setState({ kind: 'error', error: (r && r.error) || 'load failed' }); return }
      setState({ kind: 'ok', text: r.text })
    })
    return () => { alive = false }
  }, [path])

  if (state.kind === 'loading') return h('div', { style: { padding: '40px', color: 'var(--dsh-text-muted, #888)', textAlign: 'center' } }, '⏳ CSV 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '20px', color: '#f88' } }, '⚠ ' + state.error)

  const lines = state.text.split('\n').filter((l) => l.length > 0)
  const parsed = lines.map((line) => {
    const out = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ } else inQuote = !inQuote
      } else if (c === ',' && !inQuote) {
        out.push(cur); cur = ''
      } else cur += c
    }
    out.push(cur)
    return out
  })
  const header = parsed[0] || []
  const body = parsed.slice(1)

  return h('div', { style: { overflow: 'auto', maxHeight: '70vh', border: '1px solid var(--dsh-border, #333)', borderRadius: '4px' } },
    h('table', { style: { borderCollapse: 'collapse', fontSize: '12px', width: '100%' } },
      h('thead', null, h('tr', null, header.map((c, i) => h('th', { key: i, style: { border: '1px solid var(--dsh-border, #444)', padding: '4px 8px', background: 'var(--dsh-surface-2, #2a2a2a)', textAlign: 'left', position: 'sticky', top: 0 } }, c)))),
      h('tbody', null, body.slice(0, 500).map((row, i) => h('tr', { key: i, style: { background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' } }, row.map((c, j) => h('td', { key: j, style: { border: '1px solid var(--dsh-border, #444)', padding: '3px 8px' } }, c))))),
      body.length > 500 ? h('tr', null, h('td', { colSpan: header.length, style: { padding: '8px', textAlign: 'center', color: 'var(--dsh-text-muted, #888)' } }, '… 还有 ' + (body.length - 500) + ' 行未显示')) : null
    )
  )
}

function DocxView({ path }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    loadScript(VENDOR.mammoth, 'mammoth').then(() => {
      return vbRpc("thumb", { path }).then((r) => {
        if (!alive) return
        if (!r || !r.ok) { setState({ kind: 'error', error: (r && r.error) || 'load failed' }); return }
        const bytes = Uint8Array.from(atob(r.dataUrl.split(',')[1]), (c) => c.charCodeAt(0))
        return window.mammoth.convertToHtml({ arrayBuffer: bytes.buffer }).then((res) => {
          if (alive) setState({ kind: 'ok', html: res.value })
        })
      })
    }).catch((e) => {
      if (alive) setState({ kind: 'error', error: e.message || 'mammoth load failed' })
    })
    return () => { alive = false }
  }, [path])

  if (state.kind === 'loading') return h('div', { style: { padding: '40px', color: 'var(--dsh-text-muted, #888)', textAlign: 'center' } }, '⏳ Word 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '20px', color: '#f88' } }, '⚠ ' + state.error)

  return h('div', { className: 'vb-md', style: { padding: '12px', background: 'var(--dsh-surface, #1a1a1a)', borderRadius: '4px', maxHeight: '70vh', overflow: 'auto', fontSize: '14px', lineHeight: '1.6' }, dangerouslySetInnerHTML: { __html: state.html } })
}

// 花叔风格图标按钮 — 米白底 + 暖灰深图标, hover 加深
function HuashuIconBtn({ title, emoji, primary, onClick, disabled }) {
  const bg = primary ? '#b8694d' : 'transparent'
  const fg = primary ? '#fff8ee' : '#4a4742'
  const border = primary ? '#a85a3f' : 'transparent'
  return h('button', {
    onClick: disabled ? undefined : onClick,
    title,
    disabled,
    style: {
      background: bg,
      color: fg,
      border: '1px solid ' + border,
      borderRadius: '6px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: '0',
      fontSize: '15px',
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      opacity: disabled ? 0.4 : 1,
      transition: 'background 0.12s',
      fontFamily: 'inherit',
    },
    onMouseEnter: (e) => { if (!disabled && !primary) e.currentTarget.style.background = '#efe9dd' },
    onMouseLeave: (e) => { if (!disabled && !primary) e.currentTarget.style.background = 'transparent' },
  }, emoji)
}

function ReadPreview({ path }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  const [maximized, setMaximized] = React.useState(false)
  const [actionLog, setActionLog] = React.useState(null)

  React.useEffect(() => {
    let alive = true
    const kind = classify(path)
    if (kind === 'image') {
      vbRpc("fileUrl", { path }).then((r) => {
        if (!alive) return
        if (r && r.ok) setState({ kind: 'image', url: r.url })
        else setState({ kind: 'error', error: (r && r.error) || 'load failed' })
      })
    } else if (kind === 'pdf' || kind === 'xlsx' || kind === 'docx') {
      setState({ kind })
    } else if (kind === 'csv') {
      setState({ kind: 'csv' })
    } else if (kind === 'markdown' || kind === 'code' || kind === 'text') {
      vbRpc("read", { path }).then((r) => {
        if (!alive) return
        if (r && r.ok) setState({ kind: 'text', text: r.text, size: r.size, wrap: kind })
        else setState({ kind: 'error', error: (r && r.error) || 'read failed' })
      })
    } else {
      setState({ kind: 'unknown' })
    }
    return () => { alive = false }
  }, [path])

  function openInExplorer() {
    window.dispatchEvent(new CustomEvent('vb:open', { detail: { path } }))
  }

  const sizeBadge = (state.kind === 'text' && state.size) ? h('span', null, formatSize(state.size)) : null

  if (state.kind === 'loading') return h('div', { style: { padding: '12px', color: 'var(--dsh-text-muted, #888)', fontSize: '13px' } }, '⏳ 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '8px 12px', color: '#f88', fontSize: '13px' } }, '⚠ ' + state.error)
  if (state.kind === 'unknown') return h('div', { style: { padding: '8px 12px', color: 'var(--dsh-text-muted, #888)', fontSize: '13px' } }, '未识别类型（. ' + extOf(path) + '）')

  React.useEffect(() => {
    if (!maximized) return
    const onKey = (e) => { if (e.key === 'Escape') setMaximized(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [maximized])

  const reveal = () => vbRpc("finder", { path }).then((r) => {
    if (!r || !r.ok) return
    setActionLog({ text: r.method === 'spawn' ? 'Finder 已打开' : '用浏览器打开所在目录', method: r.method, diag: r.diag })
    if (r.method === 'spawn') {
      console.log('[viewboost] Finder revealed:', r.path, 'diag:', r.diag)
    } else if (r.url) {
      window.open(r.url, '_blank')
    }
  })
  const copyPath = () => {
    const text = path || ''
    const done = () => setActionLog({ text: '已复制路径' })
    const fallback = () => {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (ok) done()
        else setActionLog({ text: '复制失败，请手动复制: ' + text })
      } catch (_) {
        setActionLog({ text: '复制失败，请手动复制: ' + text })
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback)
    } else {
      fallback()
    }
  }
  const toolbar = (label) => h('div', { style: { marginBottom: '8px', display: 'flex', gap: '4px', alignItems: 'center', fontSize: '12px', color: 'oklch(0.46 0.016 62)' } },
    h('span', { style: { fontWeight: '600', fontSize: '13px', color: 'oklch(0.28 0.02 60)', marginRight: '6px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
      label + ' ',
      h('span', { style: { fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: '400' } }, basename(path))
    ),
    sizeBadge,
    h('div', { style: { flex: 1 } }),
    h(HuashuIconBtn, { title: '最大化 (全屏)', emoji: '🗖', onClick: () => setMaximized(true) }),
    h(HuashuIconBtn, { title: '复制路径', emoji: '📋', onClick: copyPath }),
    h(HuashuIconBtn, { title: '在 Finder 中显示', emoji: '🔍', onClick: reveal }),
    h(HuashuIconBtn, { title: '打开所在目录', emoji: '📂', onClick: openInExplorer }),
  )

  const previewBody = (fit) => {
    if (state.kind === 'image') return h('img', { src: state.url, alt: basename(path), style: { maxWidth: '100%', maxHeight: fit ? 'calc(100vh - 96px)' : '70vh', borderRadius: '6px', background: 'repeating-conic-gradient(#2a2a2a 0% 25%, #1a1a1a 0% 50%) 50% / 16px 16px', display: 'block', margin: '0 auto' } })
    if (state.kind === 'pdf') return h(PdfView, { path })
    if (state.kind === 'xlsx') return h(XlsxView, { path })
    if (state.kind === 'csv') return h(CsvView, { path })
    if (state.kind === 'docx') return h(DocxView, { path })
    if (state.kind === 'markdown') return renderMarkdown(state.text)
    if (state.kind === 'code') return h(CodeBlock, { text: state.text, lang: extOf(path) })
    return h(CodeBlock, { text: state.text, lang: '' })
  }

  const closeBtn = h(HuashuIconBtn, { title: '退出全屏 (Esc)', emoji: '✕', onClick: () => setMaximized(false) })

  if (maximized) {
    return h('div', {
      style: {
        position: 'fixed', inset: '0', zIndex: 99999,
        background: 'oklch(0.97 0.006 85)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 20px', boxSizing: 'border-box',
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
      },
    },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' } },
        h('span', { style: { fontWeight: '700', fontSize: '15px', color: 'oklch(0.28 0.02 60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, basename(path)),
        sizeBadge,
        h('div', { style: { flex: 1 } }),
        actionLog ? h('span', { style: { fontSize: '11px', color: 'oklch(0.46 0.016 62)', marginRight: '6px' } }, actionLog.text) : null,
        h(HuashuIconBtn, { title: '在 Finder 中显示', emoji: '🔍', onClick: reveal }),
        h(HuashuIconBtn, { title: '打开所在目录', emoji: '📂', onClick: openInExplorer }),
        h(HuashuIconBtn, { title: '复制路径', emoji: '📋', onClick: copyPath }),
        closeBtn
      ),
      h('div', { style: { flex: 1, overflow: 'auto', borderRadius: '8px', padding: '8px' } }, previewBody(true))
    )
  }

  const labelChar = state.kind === 'image' ? '🖼' : state.kind === 'pdf' ? '📕' : state.kind === 'xlsx' ? '📊' : state.kind === 'csv' ? '📊' : state.kind === 'docx' ? '📄' : state.kind === 'markdown' ? '📝' : '📄'
  return h('div', { style: { margin: '4px 0' } },
    toolbar(labelChar),
    actionLog ? h('div', { style: { fontSize: '11px', color: 'oklch(0.46 0.016 62)', margin: '0 0 6px 2px' } }, '✓ ' + actionLog.text) : null,
    previewBody(false)
  )
}

function extractPathFromArgs(args) {
  if (!args) return null
  if (typeof args === 'string') return args
  if (Array.isArray(args)) return args[0]
  if (typeof args === 'object') {
    return args.path || args.file_path || args.filePath || args.filepath || args.filename || args.name || null
  }
  return null
}

function paletteForExt(ext) {
  const m = {
    md: '#4a90e2', markdown: '#4a90e2',
    js: '#f7df1e', jsx: '#f7df1e', ts: '#3178c6', tsx: '#3178c6',
    json: '#cbcb41',
    py: '#3776ab', rb: '#cc342d', go: '#00add8', rs: '#dea584',
    html: '#e34c26', css: '#563d7c', scss: '#c69',
    png: '#ff6b6b', jpg: '#ff6b6b', jpeg: '#ff6b6b', gif: '#ff6b6b', webp: '#ff6b6b', svg: '#ff6b6b', heic: '#ff6b6b',
    pdf: '#d93838',
    xlsx: '#1d6f42', xls: '#1d6f42', xlsm: '#1d6f42', csv: '#1d6f42',
    docx: '#2b579a', doc: '#2b579a',
    pptx: '#d24726', ppt: '#d24726',
    zip: '#ffa500', tar: '#ffa500', gz: '#ffa500', '7z': '#ffa500', rar: '#ffa500',
    mp3: '#1db954', wav: '#1db954', mp4: '#1db954', mov: '#1db954', avi: '#1db954',
    txt: '#999', log: '#999', env: '#999',
    sh: '#4caf50', bash: '#4caf50', zsh: '#4caf50',
    yml: '#cb171e', yaml: '#cb171e', toml: '#cb171e',
    lock: '#888',
  }
  return m[ext] || '#6cf'
}

function Thumbnail({ path, kind }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    if (kind === 'image') {
      vbRpc("thumb", { path }).then((r) => {
        if (!alive) return
        if (r && r.ok) setState({ kind: 'ok', src: r.dataUrl })
        else setState({ kind: 'box' })
      })
    } else {
      setState({ kind: 'box' })
    }
    return () => { alive = false }
  }, [path, kind])

  const ext = extOf(path)
  const iconChar = kind === 'dir' ? '📁' :
    IMG_EXT.has(ext) ? '🖼' :
    ext === 'pdf' ? '📕' :
    (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || ext === 'csv') ? '📊' :
    ext === 'docx' ? '📄' :
    (ext === 'pptx' || ext === 'ppt') ? '📽' :
    ext === 'md' ? '📝' :
    '📄'

  return h('div', {
    style: {
      width: '100%',
      height: '70px',
      borderRadius: '6px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: state.kind === 'ok' ? '#000' : 'var(--dsh-surface-2, #1a1a1a)',
      marginBottom: '4px',
    }
  },
    state.kind === 'ok' ? h('img', { src: state.src, alt: basename(path), style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' } }) :
    state.kind === 'loading' ? h('div', { style: { color: 'var(--dsh-text-muted, #888)', fontSize: '20px' } }, '⏳') :
    h('div', { style: { fontSize: '32px', lineHeight: 1, color: paletteForExt(ext) } }, iconChar)
  )
}

function FileGrid({ path, onPick, onPickDir }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    vbRpc("list", { path }).then((r) => {
      if (!alive) return
      if (r && r.ok) {
        const entries = (r.entries || []).filter((e) => !e.name.startsWith('.') || e.name === '.gitignore' || e.name === '.env')
        entries.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        })
        setState({ kind: 'ok', entries, path: r.path })
      } else {
        setState({ kind: 'error', error: (r && r.error) || 'list failed' })
      }
    })
    return () => { alive = false }
  }, [path])

  if (state.kind === 'loading') return h('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--dsh-text-muted, #888)' } }, '⏳ 加载中…')
  if (state.kind === 'error') return h('div', { style: { padding: '20px', color: '#f88' } }, '⚠ ' + state.error)
  if (state.entries.length === 0) return h('div', { style: { padding: '40px', textAlign: 'center', color: 'var(--dsh-text-muted, #888)' } }, '（空目录）')

  const tiles = state.entries.map((e, i) => {
    const ext = extOf(e.name) || (e.isDirectory ? 'dir' : 'file')
    const color = e.isDirectory ? '#6cf' : paletteForExt(ext)
    return h('div', {
      key: i,
      onClick: () => e.isDirectory ? onPickDir(e.path) : onPick(e.path),
      style: {
        cursor: 'pointer',
        border: '1px solid var(--dsh-border, #333)',
        borderRadius: '8px',
        padding: '8px',
        background: 'var(--dsh-surface, #1a1a1a)',
        transition: 'all 0.12s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        overflow: 'hidden',
      },
      onMouseEnter: (ev) => { ev.currentTarget.style.background = 'var(--dsh-surface-2, #252525)'; ev.currentTarget.style.borderColor = color },
      onMouseLeave: (ev) => { ev.currentTarget.style.background = 'var(--dsh-surface, #1a1a1a)'; ev.currentTarget.style.borderColor = 'var(--dsh-border, #333)' },
      title: e.path + ' (' + formatSize(e.size) + ')',
    },
      h(Thumbnail, { path: e.path, kind: e.isDirectory ? 'dir' : (e.kind || 'file') }),
      h('div', { style: { fontSize: '11px', textAlign: 'center', wordBreak: 'break-all', maxWidth: '100%', color: 'var(--dsh-text, #e0e0e0)', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, e.name),
      h('div', { style: { fontSize: '9px', color: 'var(--dsh-text-muted, #888)' } }, e.isDirectory ? '目录' : formatSize(e.size))
    )
  })

  return h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', padding: '12px' } }, tiles)
}

function PreviewPane({ path, onClose, onPickDir }) {
  const [state, setState] = React.useState({ kind: 'loading' })
  React.useEffect(() => {
    let alive = true
    setState({ kind: 'loading' })
    vbRpc("stat", { path }).then((r) => {
      if (!alive) return
      if (r && r.ok) setState({ kind: 'ok', isDirectory: r.isDirectory, name: r.name, size: r.size })
      else setState({ kind: 'error', error: (r && r.error) || 'stat failed' })
    })
    return () => { alive = false }
  }, [path])

  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } },
    h('div', { style: { padding: '10px 14px', borderBottom: '1px solid var(--dsh-border, #333)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--dsh-surface, #1a1a1a)' } },
      h('div', { style: { flex: 1, fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--dsh-text, #e0e0e0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, path),
      state.kind === 'ok' && state.isDirectory ? h('button', { onClick: () => onPickDir(path), style: btnStyle(false) }, '作为根目录') : null,
      h('button', { onClick: onClose, style: { background: 'transparent', color: 'var(--dsh-text-muted, #888)', border: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 } }, '✕')
    ),
    h('div', { style: { flex: 1, overflow: 'auto', padding: '12px 14px' } },
      state.kind === 'loading' ? h('div', { style: { color: 'var(--dsh-text-muted, #888)' } }, '⏳ 加载中…') :
      state.kind === 'error' ? h('div', { style: { color: '#f88' } }, '⚠ ' + state.error) :
      state.kind === 'ok' && state.isDirectory ? h(FileGrid, { path, onPick: () => {}, onPickDir: (p) => onPickDir(p) }) :
      h(ReadPreview, { path })
    )
  )
}

function Explorer({ initialPath, onClose }) {
  const [stack, setStack] = React.useState([initialPath])
  const [preview, setPreview] = React.useState(null)
  const current = stack[stack.length - 1]

  function pushDir(p) {
    setStack((s) => [...s, p])
    setPreview(null)
  }
  function popDir() {
    setStack((s) => s.length > 1 ? s.slice(0, -1) : s)
    setPreview(null)
  }
  function goHome() {
    setStack([initialPath])
    setPreview(null)
  }

  React.useEffect(() => {
    const handler = (ev) => {
      if (ev.detail && ev.detail.path) {
        const p = ev.detail.path
        const dir = p.replace(/\/[^\/]+$/, '')
        setStack([dir])
        setPreview(p)
      }
    }
    window.addEventListener('vb:open', handler)
    return () => window.removeEventListener('vb:open', handler)
  }, [])

  const crumbs = stack.map((p, i) => h('span', { key: i, style: { display: 'inline-flex', alignItems: 'center', gap: '4px' } },
    i > 0 ? h('span', { style: { color: 'var(--dsh-text-muted, #888)' } }, ' / ') : null,
    h('button', {
      onClick: () => { setStack(stack.slice(0, i + 1)); setPreview(null) },
      style: { background: 'transparent', color: 'var(--dsh-accent, #6cf)', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }
    }, p === '/' ? '~' : (basename(p) || p))
  ))

  return h('div', {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '5vh 5vw',
      pointerEvents: 'auto',
    },
    onClick: (ev) => { if (ev.target === ev.currentTarget) onClose() }
  },
    h('div', {
      style: {
        background: 'var(--dsh-bg, #0f0f0f)',
        color: 'var(--dsh-text, #e0e0e0)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        width: preview ? '90vw' : '70vw',
        maxWidth: '1200px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--dsh-border, #333)',
      }
    },
      h('div', { style: { padding: '12px 16px', borderBottom: '1px solid var(--dsh-border, #333)', display: 'flex', alignItems: 'center', gap: '10px' } },
        h('span', { style: { fontSize: '15px', fontWeight: '600' } }, '📁 viewboost'),
        h('span', { style: { flex: 1, fontSize: '12px', color: 'var(--dsh-text-muted, #888)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, crumbs),
        h('button', { onClick: popDir, disabled: stack.length <= 1, style: { ...btnStyle(false), opacity: stack.length > 1 ? 1 : 0.4, cursor: stack.length > 1 ? 'pointer' : 'not-allowed' } }, '← 上级'),
        h('button', { onClick: goHome, style: btnStyle(false) }, '⟲ 重置'),
        h('button', { onClick: onClose, style: { background: 'transparent', color: 'var(--dsh-text-muted, #888)', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 6px' } }, '✕')
      ),
      h('div', { style: { flex: 1, display: 'flex', overflow: 'hidden' } },
        h('div', { style: { width: preview ? '50%' : '100%', borderRight: preview ? '1px solid var(--dsh-border, #333)' : 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
          h('div', { style: { flex: 1, overflow: 'auto' } },
            h(FileGrid, { path: current, onPick: (p) => setPreview(p), onPickDir: pushDir })
          )
        ),
        preview ? h('div', { style: { width: '50%', overflow: 'hidden' } },
          h(PreviewPane, { path: preview, onClose: () => setPreview(null), onPickDir: pushDir })
        ) : null
      ),
      h('div', { style: { padding: '6px 16px', borderTop: '1px solid var(--dsh-border, #333)', fontSize: '11px', color: 'var(--dsh-text-muted, #888)' } }, '💡 点目录=进入 · 点文件=右侧预览 · 🖼 缩略图 · Esc 关闭')
    )
  )
}

function openExplorer() {
  const fallback = (typeof window !== 'undefined' && window.__DSH_BOOT__ && window.__DSH_BOOT__.cwd) || '/Users/alexm5'
  vbRpc("stat", { path: fallback }).then((r) => {
    let root = fallback
    if (!r || !r.ok) root = '/'
    mount(root)
  })
  function mount(p) {
    const div = document.createElement('div')
    div.id = 'vb-explorer-root'
    document.body.appendChild(div)
    function close() {
      try { document.body.removeChild(div) } catch (_) {}
      window.removeEventListener('keydown', onKey)
    }
    function onKey(e) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    const root = React.createRoot ? React.createRoot(div) : null
    const node = h(Explorer, { initialPath: p, onClose: close })
    if (root) root.render(node)
    else React.render(node, div)
  }
}

// ===== aionui 预览工具栏扩展 (v17) =====
let aionLastPath = null        // 最近一次 read 的文件绝对路径 — 只由 read 更新, list(目录浏览)禁止写入
let aionLastRoot = null        // 最近一次请求携带的 root (工作区绝对路径)
const aionPathByTab = {}       // 文件名(basename) → 完整路径, 每次 read 时更新
function trackAionPath() {
  try {
    const orig = window.fetch
    window.fetch = function (...args) {
      try {
        const u = String((typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url)) || '')
        if (u.includes('/aionui-panel/read') || u.includes('/aionui-panel/list') || u.includes('/aionui-panel/write')) {
          const bodyStr = args[1] && args[1].body
          const b = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : null
          if (b && b.root) aionLastRoot = String(b.root).replace(/\/+$/, '')
          // 只有 read (真正打开一个文件进预览) 才更新当前路径; list 是展开文件夹, 写进去会把
          // 「复制路径」污染成文件夹路径 (v28 bug: 复制出 /xxx/对话 这样的目录)
          if (b && b.root && b.path && u.includes('/aionui-panel/read')) {
            aionLastPath = aionLastRoot + '/' + String(b.path).replace(/^\/+/, '')
            const name = String(b.path).split('/').pop()
            if (name) aionPathByTab[name] = aionLastPath
          }
        }
      } catch (_) {}
      return orig.apply(this, args)
    }
  } catch (_) {}
}
// 激活预览 tab 的文件名。必须在 .aionui-preview-col 里找 — 全文档查 [class*="tabActive"]
// 会先命中 DSH 会话标签(如「对话」), 这正是 v28 复制出 <root>/对话 的根因。
function aionActiveTabTitle() {
  const col = document.querySelector('.aionui-preview-col')
  if (!col) return ''
  const active = col.querySelector('[class*="tabActive"]')
  if (!active) return ''
  const titleEl = active.querySelector('[class*="tabTitle"]')
  const raw = (titleEl && (titleEl.getAttribute('title') || titleEl.textContent))
    || active.getAttribute('title') || active.textContent || ''
  return String(raw).replace(/[\u00D7\u2715\u2716]/g, '').trim()
}
// 候选路径按可信度排序: tab名映射(来自真实read) → 上次read所在目录+tab名 → root+tab名 → 相对路径标题拼root → 上次read的文件
function aionPathCandidates() {
  const cands = []
  const title = aionActiveTabTitle()
  if (title) {
    if (aionPathByTab[title]) cands.push(aionPathByTab[title])
    if (!title.includes('/')) {
      if (aionLastPath) cands.push(aionLastPath.replace(/\/[^\/]*$/, '') + '/' + title)
      if (aionLastRoot) cands.push(aionLastRoot + '/' + title)
    } else if (aionLastRoot && !title.includes(':')) {
      // 子目录文件的 tab 标题是工作区相对路径 (如 04_传动机构/plunger-drive-simulation-v1.1.md) — 直接拼 root
      cands.push(aionLastRoot + '/' + title.replace(/^\.?\//, ''))
    }
  }
  if (aionLastPath) cands.push(aionLastPath)
  return cands.filter((p, i, a) => p && a.indexOf(p) === i)
}
// 同步版: 第一个候选 (兼容旧调用方)
function aionCurrentPath() {
  return aionPathCandidates()[0] || null
}
// 兜底定位: 用 vb.list 从工作区 root 做 BFS 按文件名找文件 (浅层优先, 跳过隐藏/依赖目录)
async function aionLocateByName(root, name) {
  const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv'])
  const queue = [{ p: String(root).replace(/\/+$/, ''), d: 0 }]
  const maxDirs = 150, maxDepth = 6
  let visited = 0
  while (queue.length && visited < maxDirs) {
    const { p, d } = queue.shift()
    visited++
    let r
    try { r = await vbRpc('list', { path: p }) } catch (_) { continue }
    if (!r || !r.ok || !Array.isArray(r.entries)) continue
    for (const e of r.entries) {
      if (!e || !e.name) continue
      const child = p + '/' + e.name
      if (!e.isDirectory) {
        if (e.name === name) return child
      } else if (d < maxDepth && !SKIP.has(e.name) && !String(e.name).startsWith('.')) {
        queue.push({ p: child, d: d + 1 })
      }
    }
  }
  return null
}
// 异步版(按钮用): 激活 tab 绑定的候选先 stat 校验 → 全败则按 tab 文件名 BFS 定位 → 无激活 tab 才退回最近 read。
// 绝不把不存在的路径交给 Finder, 也绝不因为「上一个读过的文件存在」就复制错文件。
async function aionResolvePath() {
  const title = aionActiveTabTitle()
  const tied = []
  if (title) {
    if (aionPathByTab[title]) tied.push(aionPathByTab[title])
    if (!title.includes('/')) {
      if (aionLastPath) tied.push(aionLastPath.replace(/\/[^\/]*$/, '') + '/' + title)
      if (aionLastRoot) tied.push(aionLastRoot + '/' + title)
    } else if (aionLastRoot && !title.includes(':')) {
      tied.push(aionLastRoot + '/' + title.replace(/^\.?\//, ''))
    }
  }
  let statAnswered = false
  for (const p of tied) {
    try {
      const r = await vbRpc('stat', { path: p })
      if (r && r.ok) {
        statAnswered = true
        if (r.isDirectory === false) return p
      } else if (r && r.error === 'ENOENT') {
        statAnswered = true
      }
    } catch (_) {}
  }
  if (title && aionLastRoot) {
    const found = await aionLocateByName(aionLastRoot, title.split('/').pop())
    if (found) return found
  }
  if (!title && aionLastPath) return aionLastPath
  // stat 通道失联(全无应答)时才退回未验证猜测; 正常情况下找不到就是找不到, 不发假路径
  return statAnswered ? null : (tied[0] || aionLastPath || null)
}

function vbStyle(css) {
  try {
    let el = document.getElementById('viewboost-style')
    if (!el) { el = document.createElement('style'); el.id = 'viewboost-style'; document.head.appendChild(el) }
    el.textContent = css
  } catch (_) {}
}

let vbToastTimer = null
let VB_TIMER = null
function vbToast(msg) {
  const old = document.querySelector('.vb-aion-toast')
  if (old) { try { old.remove() } catch (_) {} }
  const t = document.createElement('div')
  t.className = 'vb-aion-toast'
  t.textContent = msg
  t.style.cssText = 'position:fixed;bottom:96px;left:16px;z-index:99999;background:oklch(0.28 0.02 60);color:oklch(0.97 0.006 85);padding:8px 14px;border-radius:6px;font-size:12px;font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.18);max-width:70vw;word-break:break-all;cursor:pointer;user-select:all;-webkit-user-select:all;animation:vb-toast-hide 3s forwards'
  t.onclick = () => { try { t.remove() } catch (_) {} }
  t.addEventListener('animationend', () => { if (t.parentNode) { try { t.parentNode.removeChild(t) } catch (_) {} } })
  document.body.appendChild(t)
  return t
}

function vbCopyText(text) {
  // 1) 同步 execCommand — 点击手势内最可靠, 立即反馈 (官方 writeClipboard 同款: readonly + 离屏可见)
  let execOk = false
  if (typeof document.execCommand === 'function') {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    el.style.top = '0'
    document.body.appendChild(el)
    el.select()
    el.setSelectionRange(0, text.length)
    try { execOk = document.execCommand('copy') } catch (_) {}
    document.body.removeChild(el)
  }
  // 2) 异步 Clipboard API 双保险 (写不进也静默; 某些场景 writeText 会挂起, 不能等它)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { navigator.clipboard.writeText(text).catch(() => {}) } catch (_) {}
  }
  if (execOk) {
    vbToast('已复制路径: ' + text)
    return
  }
  // 3) 最后兜底: 全选路径文本让用户 Cmd+C
  const t = vbToast('⚠ 自动复制失败，已选中路径，按 Cmd/Ctrl+C 复制：' + text)
  try {
    const range = document.createRange()
    range.selectNodeContents(t)
    const sel = window.getSelection()
    if (sel) { sel.removeAllRanges(); sel.addRange(range) }
  } catch (_) {}
}

let aionMaxActive = false
function toggleAionMax() {
  aionMaxActive = !aionMaxActive
  document.body.classList.toggle('vb-aion-maximized', aionMaxActive)
  vbToast(aionMaxActive ? '已全屏预览 (Esc 退出)' : '已退出全屏')
}

function installAionToolbar() {
  trackAionPath()
  const mkBtn = (title, iconName, fn) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.title = title
    b.innerHTML = vbIcon(iconName)
    b.style.cssText = 'background:transparent;border:none;border-radius:6px;cursor:pointer;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;padding:0;margin:0 1px;color:oklch(0.28 0.02 60)'
    // hover 提示 (自定义浮层, 不依赖原生 title; 图标按钮靠它显示功能名)
    let tip = null
    const showTip = () => {
      if (tip) return
      tip = document.createElement('div')
      tip.textContent = title
      tip.style.cssText = 'position:fixed;z-index:100000;background:oklch(0.28 0.02 60);color:oklch(0.97 0.006 85);padding:4px 10px;border-radius:5px;font-size:12px;font-family:"Noto Sans JP","Hiragino Kaku Gothic ProN",sans-serif;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap'
      document.body.appendChild(tip)
      const r = b.getBoundingClientRect()
      tip.style.left = Math.max(4, r.left + r.width / 2 - tip.offsetWidth / 2) + 'px'
      tip.style.top = (r.top - tip.offsetHeight - 6) + 'px'
    }
    const hideTip = () => { if (tip) { try { tip.remove() } catch (_) {} tip = null } }
    b.addEventListener('mouseenter', showTip)
    b.addEventListener('mouseleave', hideTip)
    b.addEventListener('click', hideTip)
    b.onclick = fn
    return b
  }
  const ensure = () => {
    const col = document.querySelector('.aionui-preview-col')
    if (!col || col.querySelector('.vb-aion-ext')) return
    // 锚点链: 刷新按钮 → 下载按钮 → 任一按钮。图片/预览态工具栏没有「刷新」, 只有「下载」(v31 gap: 图片模式按钮整个不注入)
    const btns = [...col.querySelectorAll('button')]
    const anchor = btns.find((x) => (x.getAttribute('title') || '').includes('刷新') || (x.textContent || '').trim() === '刷新')
      || btns.find((x) => (x.getAttribute('title') || '') === '下载')
      || btns[0]
    const hostEl = anchor ? anchor.parentElement : null
    if (!hostEl || hostEl.querySelector('.vb-aion-ext')) return
    const wrap = document.createElement('div')
    wrap.className = 'vb-aion-ext'
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:1px;margin:0 2px;border-left:1px solid oklch(0.85 0.012 75);padding-left:4px'
    wrap.appendChild(mkBtn('在访达显示', 'folder', async () => {
      const p = await aionResolvePath()
      if (!p) return vbToast('未能定位当前文件，请在左侧重新点开它')
      vbRpc("finder", { path: p }).then((r) => {
        vbToast(r && r.ok ? (r.method === 'spawn' ? 'Finder 已打开' : '用浏览器打开目录') : ('失败: ' + ((r && r.error) || '未知')))
      }).catch((e) => vbToast('失败: ' + String(e && e.message || e)))
    }))
    wrap.appendChild(mkBtn('全屏放大 (Esc 退出)', 'maximize', toggleAionMax))
    wrap.appendChild(mkBtn('复制路径', 'clip', async () => {
      const p = await aionResolvePath()
      if (!p) return vbToast('未能定位当前文件，请在左侧重新点开它')
      vbCopyText(p)
    }))
    wrap.appendChild(mkBtn('复制文件（访达里可粘贴）', 'copy', async () => {
      const p = await aionResolvePath()
      if (!p) return vbToast('未能定位当前文件，请在左侧重新点开它')
      vbRpc("copyfile", { path: p }).then((r) => {
        vbToast(r && r.ok ? '文件已复制，切到 Finder 按 Cmd+V 粘贴' : ('失败: ' + ((r && r.error) || '未知')))
      }).catch((e) => vbToast('失败: ' + String(e && e.message || e)))
    }))
    hostEl.appendChild(wrap)
  }
  ensure()
  const mo = new MutationObserver(ensure)
  mo.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aionMaxActive) toggleAionMax() })
}

module.exports = {
  name: 'viewboost',
  inject: ['slots'],
  apply(ctx) {
    const slots = ctx.slots
    if (slots === undefined) return
    VB_TIMER = null

    vbStyle(`
      .vb-md a { color: var(--dsh-accent, #6cf); text-decoration: none; }
      .vb-md a:hover { text-decoration: underline; }
      .vb-md code { background: var(--dsh-surface-2, #2a2a2a); padding: 1px 6px; border-radius: 3px; font-family: ui-monospace, monospace; font-size: 0.9em; }
      .vb-md pre code { background: transparent; padding: 0; }
      .vb-md h1, .vb-md h2, .vb-md h3 { color: var(--dsh-text, #e0e0e0); }
      .vb-md p { color: var(--dsh-text, #e0e0e0); }
      .vb-md table { border-collapse: collapse; }
      .vb-md td, .vb-md th { border: 1px solid var(--dsh-border, #444); padding: 3px 6px; }
      /* aionui 预览最大化 (v17) */
      body.vb-aion-maximized .aionui-preview-col { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99999 !important; background: var(--dsh-bg, #f6f5f3); }
      /* toast 自动消失 (纯 CSS, 不依赖 timer) */
      @keyframes vb-toast-hide { 0%, 78% { opacity: 1 } 100% { opacity: 0 } }
    `)

    installAionToolbar()

    // 更正规的路径追踪 (dsh-better-sidebar 启发): ctx.workspaces.openPath 是所有文件打开的唯一入口
    try {
      const workspaces = ctx.get('workspaces')
      if (workspaces && typeof workspaces.openPath === 'function' && !workspaces.__vbOpenPathWrapped) {
        const original = workspaces.openPath
        workspaces.__vbOpenPathWrapped = true
        workspaces.openPath = function (path) {
          if (typeof path === 'string' && path) aionLastPath = path
          return original.call(this, path)
        }
      }
    } catch (_) {}

    slots.inject('tool.call.toolview', () => slots.register(
      { name: 'tool.call.toolview', key: 'read', priority: -1 },
      (props) => {
        const path = extractPathFromArgs(props && props.block && props.block.input)
        if (!path) return null
        return h(ReadPreview, { path })
      }
    ))

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'viewboost-explorer', order: 100 },
      () => null
    ))

    slots.inject('conversation.input.left', () => slots.register(
      { name: 'conversation.input.left', id: 'viewboost-explorer-btn', order: 50 },
      () => h('button', {
        onClick: openExplorer,
        title: '打开文件夹浏览器',
        style: {
          background: 'transparent',
          color: 'var(--dsh-text-muted, #888)',
          border: '1px solid var(--dsh-border, #444)',
          borderRadius: '6px',
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: '13px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }
      }, '📁 浏览')
    ))

    // Token 用量小卡 — 浮层
    let usageOpen = false

    function formatTokens(n) {
      if (n < 1000) return String(n)
      if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K'
      return (n / 1000000).toFixed(n < 10000000 ? 2 : 1) + 'M'
    }
    // 卡片宽度 = 左侧栏「最小可拖宽度」264px（layout clampWidth 下限）− 两侧 16px 边距，
    // 固定 232px，永不超出左侧栏（含拖窄到 264 时）
    function vbSidebarWidth() {
      return 232
    }
    // 左侧栏是否处于展开态（rail 收起态 56px 时隐藏 FAB，避免溢出）
    function vbSidebarOpen() {
      try {
        const el = document.querySelector('[class*="sidebarCol"]') || document.querySelector('aside')
        if (el) return el.getBoundingClientRect().width > 150
      } catch (e) { /* ignore */ }
      return true
    }
    function UsageCard() {
      const [state, setState] = React.useState({ kind: 'loading' })
      const [open, setOpen] = React.useState(false)

      React.useEffect(() => {
        const handler = () => setOpen((o) => !o)
        window.addEventListener('vb:usage-toggle', handler)
        return () => window.removeEventListener('vb:usage-toggle', handler)
      }, [])

      // 侧栏展开/收起（rail）时同步隐藏 FAB，避免溢出
      const [sidebarOpen, setSidebarOpen] = React.useState(vbSidebarOpen())
      React.useEffect(() => {
        const el = document.querySelector('[class*="sidebarCol"]') || document.querySelector('aside')
        if (!el || typeof ResizeObserver === 'undefined') return
        const ro = new ResizeObserver(() => setSidebarOpen(vbSidebarOpen()))
        ro.observe(el)
        return () => ro.disconnect()
      }, [])

      React.useEffect(() => {
        if (!open) return
        let alive = true
        setState({ kind: 'loading' })
        // 并行: 本地会话统计 + MiniMax 真实配额 (后者失败也行)
        Promise.all([
          vbRpc("usage").catch((e) => ({ ok: false, error: String(e) })),
          vbRpc("minimax").catch((e) => ({ ok: false, error: String(e) })),
        ]).then(([local, remote]) => {
          if (!alive) return
          const localOk = local && local.ok
          const remoteOk = remote && remote.ok && Array.isArray(remote.windows) && remote.windows.length > 0
          if (localOk || remoteOk) {
            // 本地用量为主 (简单 3 宫格), MiniMax 配额放状态行
            setState({ kind: 'ok', data: {
              ok: true,
              local: localOk ? local : null,
              remote: remoteOk ? { source: 'minimax', plan: remote.plan, region: remote.region, modelGroup: remote.modelGroup, remains: remote.remains, windows: remote.windows } : null,
              nowMs: Date.now(),
            }})
          } else {
            setState({ kind: 'error', error: (local && local.error) || (remote && remote.error) || 'load failed' })
          }
        })
        return () => { alive = false }
      }, [open])

      return h(React.Fragment, null,
        !sidebarOpen ? null : h('button', {
          onClick: () => window.dispatchEvent(new CustomEvent('vb:usage-toggle')),
          title: '查看 Token 用量',
          style: {
            position: 'fixed', bottom: '12px', left: '12px',
            zIndex: 9999,
            background: 'transparent',
            color: open ? 'oklch(0.28 0.02 60)' : 'oklch(0.46 0.016 62)',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            padding: '6px',
            fontSize: '15px',
            lineHeight: 1,
            boxShadow: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
            transition: 'background 0.15s',
          },
          onMouseEnter: (e) => { e.currentTarget.style.background = 'oklch(0.93 0.008 80)' },
          onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent' },
        }, open ? '✕' : '📊'),

        !open || !sidebarOpen ? null : state.kind === 'loading' ? h('div', {
          style: {
            position: 'fixed', bottom: '54px', left: '16px',
            width: vbSidebarWidth(), padding: '14px',
            background: 'oklch(0.97 0.006 85)',
            border: '1px solid oklch(0.8 0.014 75)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            color: 'oklch(0.46 0.016 62)',
            fontSize: '11px',
            zIndex: 9998,
            fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
          }
        }, '⏳ 加载用量…') : state.kind === 'error' ? h('div', {
          style: {
            position: 'fixed', bottom: '54px', left: '16px',
            width: vbSidebarWidth(), padding: '14px',
            background: 'oklch(0.97 0.006 85)',
            border: '1px solid oklch(0.8 0.014 75)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            color: '#c14545',
            fontSize: '11px',
            zIndex: 9998,
            fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
          }
        }, '⚠ ' + state.error) : h(UsageContent, { data: state.data })
      )
    }

    function UsageContent({ data }) {
      const { local, remote, nowMs } = data
      const now = new Date(nowMs)
      const todayLabel = (now.getMonth() + 1) + '/' + now.getDate()
      const sessions = (local && local.all && local.all.sessions) || 0

      // 倒计时格式化 (MiniMax 风格: e.g. "2h 14m")
      function fmtCountdown(ms) {
        if (!ms || ms <= 0) return ''
        const min = Math.round(ms / 60000)
        if (min < 60) return min + 'm'
        const h = Math.floor(min / 60)
        const m = min % 60
        if (h < 24) return h + 'h ' + m + 'm'
        const d = Math.floor(h / 24)
        return d + 'd ' + (h % 24) + 'h'
      }

      // FanBox usage-trio 风格: 数字在上(bold), 小标签在下
      const trioItem = (label, val) => h('div', {
        style: {
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
          background: 'oklch(0.952 0.007 83)',
          borderRadius: '6px',
          padding: '5px 2px',
          fontSize: '10px',
          color: 'oklch(0.46 0.016 62)',
          border: '1px solid oklch(0.88 0.012 78)',
        }
      },
        h('b', { style: { fontSize: '12.5px', color: 'oklch(0.28 0.02 60)', fontVariantNumeric: 'tabular-nums', fontWeight: '700' } }, val),
        label
      )

      const r5 = (local && local.recent) || {}
      const rt = (local && local.today) || {}
      const rw = (local && local.week) || {}
      const trioRow = h('div', { style: { display: 'flex', gap: '4px', margin: '5px 0 3px' } },
        trioItem('近5h', formatTokens(r5.total || 0)),
        trioItem('今日', formatTokens(rt.total || 0)),
        trioItem('本周', formatTokens(rw.total || 0))
      )

      // MiniMax 配额状态行 (次要)
      const mmLine = (remote && remote.windows && remote.windows.length) ? (() => {
        const w5 = remote.windows[0] || {}
        const ww = remote.windows[1] || {}
        const st5 = (w5.statusLabel && w5.statusLabel !== '正常') ? w5.statusLabel : '正常'
        return '🟢 ' + (remote.region || '') + ' · 5h ' + st5 + (w5.resetInMs ? ' 剩' + fmtCountdown(w5.resetInMs) : '') + ' · 周剩 ' + Math.round(ww.remainingPercent || 0) + '%'
      })() : null

      return h('div', {
        style: {
          position: 'fixed', bottom: '54px', left: '16px',
          width: vbSidebarWidth(),
          background: 'oklch(0.97 0.006 85)',
          border: '1px solid oklch(0.8 0.014 75)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          color: 'oklch(0.28 0.02 60)',
          zIndex: 9998,
          overflow: 'hidden',
          padding: '12px 14px 10px',
          fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif',
        }
      },
        h('div', {
          style: {
            fontSize: '13px', fontWeight: '700',
            marginBottom: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: 'oklch(0.28 0.02 60)',
          }
        },
          h('span', null, '📊 Token 用量'),
          h('span', { style: { fontSize: '10px', fontWeight: '400', color: 'oklch(0.46 0.016 62)' } }, todayLabel)
        ),
        trioRow,
        mmLine ? h('div', { style: { fontSize: '10px', color: 'oklch(0.46 0.016 62)', marginBottom: '6px', lineHeight: 1.4 } }, mmLine) : null,
        h('div', {
          style: {
            fontSize: '10px', color: 'oklch(0.46 0.016 62)',
            borderTop: '1px solid oklch(0.85 0.012 75)',
            paddingTop: '6px',
            lineHeight: 1.4,
            display: 'flex', justifyContent: 'space-between',
          }
        },
          h('span', null, remote ? 'MiniMax Subscription' : 'token 总量 · 本地会话统计'),
          h('span', null, sessions + ' 会话')
        )
      )
    }

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'viewboost-usage-card', order: 200 },
      () => h(UsageCard)
    ))
  }
}
return module.exports; } });
