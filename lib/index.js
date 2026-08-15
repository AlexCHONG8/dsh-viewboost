// viewboost host half — 右侧预览工具栏增强 + Token 用量 + 文件操作
// 通过 /viewboost/* HTTP 路由暴露 (真实插件, 非动态)
const BODY_LIMIT = 8 * 1024 * 1024

function json(response, status, value) {
  try {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(value))
  } catch (_) {
    try { response.end('{}') } catch (_2) {}
  }
}

async function readBody(request) {
  const chunks = []
  let size = 0
  await new Promise((resolve, reject) => {
    request.on('data', (chunk) => {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += b.length
      if (size > BODY_LIMIT) { reject(new Error('body too large')); return }
      chunks.push(b)
    })
    request.on('end', resolve)
    request.on('error', reject)
  })
  return Buffer.concat(chunks)
}

function objectBody(value) {
  try { return JSON.parse(String(value)) } catch (_) { return {} }
}

const IMG_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic', 'heif', 'avif', 'tiff'])
const mtimeMs = (v) => v instanceof Date ? v.getTime() : (typeof v === 'number' ? v : 0)

function extOf(p) {
  const b = (p || '').split('/').pop() || ''
  const i = b.lastIndexOf('.')
  return i >= 0 ? b.slice(i + 1).toLowerCase() : ''
}

function classify(p) {
  const e = extOf(p)
  if (IMG_EXT.has(e)) return 'image'
  if (e === 'pdf') return 'pdf'
  if (e === 'xlsx' || e === 'xls' || e === 'xlsm') return 'xlsx'
  if (e === 'csv' || e === 'tsv') return 'csv'
  if (e === 'docx') return 'docx'
  if (e === 'pptx' || e === 'ppt') return 'pptx'
  if (e === 'md' || e === 'markdown' || e === 'mdown' || e === 'mkd') return 'markdown'
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'css', 'scss', 'sass', 'html', 'xml', 'yaml', 'yml', 'toml', 'sh', 'bash', 'zsh', 'sql', 'rb', 'php', 'swift', 'kt', 'lua', 'vue', 'svelte'].includes(e)) return 'code'
  if (['txt', 'log', 'env', 'ini', 'conf'].includes(e)) return 'text'
  return 'unknown'
}

function mimeForExt(e) {
  const m = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif', tiff: 'image/tiff',
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    csv: 'text/csv',
  }
  return m[e] || 'application/octet-stream'
}

export default {
  name: 'viewboost',
  inject: ['fs', 'webServer'],
  apply(ctx) {
    const fs = ctx.fs
    const subprocess = ctx.get('subprocess')

    // 统一注册: path -> async (args) => result
    function route(path, handler) {
      ctx.webServer.register({
        kind: 'exact',
        path,
        handler: async (request, response) => {
          try {
            if (request.method === 'POST' || request.method === 'PUT') {
              const body = objectBody(await readBody(request))
              json(response, 200, await handler(body))
            } else {
              const url = new URL(request.url || path, 'http://dsh.local')
              const args = {}
              for (const [k, v] of url.searchParams) args[k] = v
              json(response, 200, await handler(args))
            }
          } catch (e) {
            json(response, 500, { ok: false, error: 'INTERNAL', message: String(e && e.message || e) })
          }
        },
      })
    }

    route('/viewboost/list', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (!stat.isDirectory) {
        return {
          ok: true, path: args.path,
          entries: [{ name: stat.name || args.path.split('/').pop() || args.path, path: args.path, isDirectory: false, size: stat.size, mtimeMs: mtimeMs(stat.mtime), kind: classify(args.path) }],
        }
      }
      const list = await fs.listDir(target)
      const entries = []
      for (const e of list) {
        const childPath = args.path.replace(/\/+$/, '') + '/' + e.name
        let childStat = null
        try { childStat = await fs.stat(e.target) } catch (_) {}
        entries.push({
          name: String(e.name || ''), path: childPath, isDirectory: !!e.isDirectory,
          size: childStat ? (Number(childStat.size) || 0) : 0,
          mtimeMs: childStat ? mtimeMs(childStat.mtime) : 0,
          kind: e.isDirectory ? 'dir' : classify(childPath),
        })
      }
      return { ok: true, path: args.path, entries }
    })

    route('/viewboost/read', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.isDirectory) return { ok: false, error: 'EISDIR' }
      if (stat.size > 5 * 1024 * 1024) return { ok: false, error: 'EFBIG', size: stat.size }
      const text = await fs.readText(target)
      return { ok: true, path: args.path, text, size: stat.size }
    })

    route('/viewboost/fileUrl', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.size > 50 * 1024 * 1024) return { ok: false, error: 'EFBIG', size: stat.size }
      return { ok: true, url: fs.fileUrl(target), mime: mimeForExt(extOf(args.path)) }
    })

    route('/viewboost/stat', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      return { ok: true, isDirectory: !!stat.isDirectory, size: Number(stat.size) || 0, mtimeMs: mtimeMs(stat.mtime), name: String(stat.name || ''), kind: classify(args.path) }
    })

    route('/viewboost/thumb', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.isDirectory) return { ok: false, error: 'EISDIR' }
      if (stat.size > 50 * 1024 * 1024) return { ok: false, error: 'EFBIG', size: stat.size }
      const maxBytes = 8 * 1024 * 1024
      const bytes = await fs.readBytes(target, undefined, maxBytes)
      if (bytes.length === 0) return { ok: false, error: 'EMPTY' }
      let bin = ''
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
      const b64 = Buffer.from(bytes).toString('base64')
      const mime = mimeForExt(extOf(args.path))
      return { ok: true, dataUrl: 'data:' + mime + ';base64,' + b64, mime, size: bytes.length }
    })

    route('/viewboost/binary', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.isDirectory) return { ok: false, error: 'EISDIR' }
      const cap = args.maxBytes || 30 * 1024 * 1024
      if (stat.size > cap) return { ok: false, error: 'EFBIG', size: stat.size }
      const bytes = await fs.readBytes(target, undefined, cap)
      if (bytes.length === 0) return { ok: false, error: 'EMPTY' }
      const b64 = Buffer.from(bytes).toString('base64')
      return { ok: true, mime: mimeForExt(extOf(args.path)), b64, size: bytes.length }
    })

    route('/viewboost/finder', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      const diag = { hasSubprocess: !!subprocess }
      if (subprocess && typeof subprocess.spawn === 'function') {
        let exe = null
        try { exe = await subprocess.resolveExecutable('open') } catch (e) { diag.resolveError = String(e && e.message || e) }
        if (exe) {
          try {
            const pp = fs.processPath(target)
            const dir = pp.slice(0, pp.lastIndexOf('/')) || '/'
            const handle = subprocess.spawn({
              argv: [exe, '-R', pp], cwd: dir,
              stdio: { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' }, graceMs: 5000,
            })
            diag.pid = handle && handle.pid
            return { ok: true, method: 'spawn', path: String(args.path || ''), diag }
          } catch (e) { diag.spawnError = String(e && e.message || e) }
        }
      }
      return { ok: true, method: 'url', path: String(args.path || ''), url: fs.fileUrl(target), diag }
    })

    route('/viewboost/copyfile', async (args) => {
      const target = await fs.resolve(args.path)
      const stat = await fs.stat(target)
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.isDirectory) return { ok: false, error: 'EISDIR' }
      if (!subprocess || typeof subprocess.spawn !== 'function') return { ok: false, error: 'NO_SUBPROCESS' }
      let osa = null
      try { osa = await subprocess.resolveExecutable('osascript') } catch (_) {}
      if (!osa) return { ok: false, error: 'NO_OSASCRIPT' }
      const pp = fs.processPath(target)
      const script = 'set the clipboard to POSIX file "' + String(pp).replace(/"/g, '\\"') + '"'
      let handle
      try {
        handle = subprocess.spawn({
          argv: [osa, '-e', script], cwd: '/',
          stdio: { stdin: 'ignore', stdout: { maxBytes: 8192 }, stderr: { maxBytes: 8192 } },
          graceMs: 15000,
        })
      } catch (e) { return { ok: false, error: 'SPAWN', message: String(e && e.message || e) } }
      let outcome
      try { outcome = await handle.done } catch (e) { return { ok: false, error: 'SPAWN', message: String(e && e.message || e) } }
      if (outcome.exitCode !== 0) {
        const errText = (handle.collected && handle.collected.stderr) ? handle.collected.stderr.readFrom(0).text : ''
        return { ok: false, error: 'OSA_' + String(outcome.exitCode), stderr: String(errText).slice(0, 300) }
      }
      return { ok: true, path: pp }
    })

    route('/viewboost/usage', async () => {
      const dshHome = process.env.DSH_HOME || '/Users/alexm5/.dsh'
      const cachePath = dshHome + '/storages/session_projcache.json'
      let target = null
      try { target = await fs.resolve(cachePath) } catch (_) {}
      if (!target) return { ok: false, error: 'NO_PATH' }
      let stat = null
      try { stat = await fs.stat(target) } catch (_) {}
      if (!stat) return { ok: false, error: 'ENOENT' }
      if (stat.size > 50 * 1024 * 1024) return { ok: false, error: 'EFBIG', size: stat.size }
      let text = ''
      try { text = await fs.readText(target) } catch (_) { return { ok: false, error: 'EREAD' } }
      let data = null
      try { data = JSON.parse(text) } catch (_) { return { ok: false, error: 'EPARSE' } }
      const sessions = (data && data.tables && data.tables.sessions) || {}
      const now = new Date()
      const nowMs = now.getTime()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const dayMs = 24 * 60 * 60 * 1000
      const dow = now.getDay()
      const weekStart = todayStart - (dow === 0 ? 6 : dow - 1) * dayMs
      const recentStart = nowMs - 5 * 60 * 60 * 1000
      let win5h = { in: 0, out: 0, sessions: 0 }
      let week = { in: 0, out: 0, sessions: 0 }
      let today = { in: 0, out: 0, sessions: 0 }
      let all = { in: 0, out: 0, sessions: 0 }
      function addBucket(b, tu) {
        const ins = (tu.uncachedInputTokens || 0) + (tu.cacheReadTokens || 0) + (tu.cacheWriteTokens || 0)
        const outs = tu.outputTokens || 0
        b.in += ins; b.out += outs; b.sessions += 1
        return ins + outs
      }
      for (const sid of Object.keys(sessions)) {
        const s = sessions[sid]
        const tu = s && s.rows && s.rows.tokenUsage && s.rows.tokenUsage.val
        if (!tu || !tu.totals) continue
        const created = (s && s.identity && s.identity.createdAt) || 0
        const lastPrompt = (s && s.rows && s.rows.sessionListMetadata && s.rows.sessionListMetadata.val && s.rows.sessionListMetadata.val.lastPromptAt) || 0
        const lastActive = Math.max(created, lastPrompt)
        addBucket(all, tu.totals)
        if (lastActive >= todayStart) addBucket(today, tu.totals)
        if (lastActive >= weekStart) addBucket(week, tu.totals)
        if (lastActive >= recentStart) addBucket(win5h, tu.totals)
      }
      const LIMIT_5H_PLUS = 600_000_000
      const LIMIT_WEEK_PLUS = 7 * LIMIT_5H_PLUS
      const win5hUsed = win5h.in + win5h.out
      const weekUsed = week.in + week.out
      return {
        ok: true, source: 'local', minimaxConfigured: false,
        windows: [
          { label: '5h', used: win5hUsed, limit: LIMIT_5H_PLUS, usedPercent: Math.min(100, (win5hUsed / LIMIT_5H_PLUS) * 100), sessions: win5h.sessions, resetAt: nowMs + 5 * 60 * 60 * 1000 },
          { label: '周', used: weekUsed, limit: LIMIT_WEEK_PLUS, usedPercent: Math.min(100, (weekUsed / LIMIT_WEEK_PLUS) * 100), sessions: week.sessions, resetAt: weekStart + 7 * dayMs },
        ],
        today: { in: today.in, out: today.out, total: today.in + today.out, sessions: today.sessions },
        week: { in: week.in, out: week.out, total: week.in + week.out, sessions: week.sessions },
        all: { in: all.in, out: all.out, total: all.in + all.out, sessions: all.sessions },
        recent: { in: win5h.in, out: win5h.out, total: win5hUsed, sessions: win5h.sessions },
        nowMs, todayStartMs: todayStart, weekStartMs: weekStart, recentStartMs: recentStart,
      }
    })

    route('/viewboost/minimax', async () => {
      let key = null
      let isCN = false
      try {
        const envT = await fs.resolve('/Users/alexm5/.dsh/viewboost.env')
        const envStat = await fs.stat(envT)
        if (envStat) {
          const text = await fs.readText(envT)
          for (const line of text.split('\n')) {
            const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^\s#].*?)\s*$/)
            if (!m) continue
            const k = m[1]
            const v = m[2].replace(/^["']|["']$/g, '')
            if (k === 'MINIMAX_CN_API_KEY') { key = v; isCN = true }
            else if ((k === 'MINIMAX_API_KEY' || k === 'MINIMAX_API_TOKEN') && !key) key = v
          }
        }
      } catch (_) {}
      if (!key) return { ok: false, error: 'NO_KEY' }
      if (!subprocess || typeof subprocess.spawn !== 'function') return { ok: false, error: 'NO_SUBPROCESS' }
      let curl = null
      try { curl = await subprocess.resolveExecutable('curl') } catch (_) {}
      if (!curl) return { ok: false, error: 'NO_CURL' }
      const url = isCN ? 'https://api.minimaxi.com/v1/token_plan/remains' : 'https://www.minimax.io/v1/token_plan/remains'
      let handle
      try {
        handle = subprocess.spawn({
          argv: [curl, '-sS', '-m', '25', '-H', 'Authorization: Bearer ' + key, '-H', 'Content-Type: application/json', url],
          cwd: '/',
          stdio: { stdin: 'ignore', stdout: { maxBytes: 4 * 1024 * 1024, spill: { maxBytes: 8 * 1024 * 1024 } }, stderr: { maxBytes: 8192 } },
          graceMs: 30000,
        })
      } catch (e) { return { ok: false, error: 'SPAWN', message: String(e && e.message || e) } }
      let outcome
      try { outcome = await handle.done } catch (e) { return { ok: false, error: 'SPAWN', message: String(e && e.message || e) } }
      const stdoutText = (handle.collected && handle.collected.stdout) ? handle.collected.stdout.readFrom(0).text : ''
      if (outcome.exitCode !== 0) return { ok: false, error: 'CURL_' + String(outcome.exitCode) }
      let payload
      try { payload = JSON.parse(stdoutText) } catch (_) { return { ok: false, error: 'EPARSE' } }
      const data = (payload && payload.data) || payload || {}
      const baseResp = data.base_resp || {}
      if (baseResp.status_code !== undefined && baseResp.status_code !== 0) {
        return { ok: false, error: 'API', status_code: baseResp.status_code, status_msg: baseResp.status_msg }
      }
      const mr = Array.isArray(data.model_remains) ? data.model_remains : []
      const pickGroup = mr.find((r) => r && r.model_name === 'general')
        || mr.find((r) => r && r.model_name !== 'video' && r.model_name !== 'speech')
        || mr[0]
      if (!pickGroup) return { ok: false, error: 'EMPTY', region: isCN ? 'CN' : 'GLOBAL' }
      const statusLabel = (s) => s === 2 ? '已用尽' : s === 3 ? '不限' : '正常'
      const intervalRemainPct = Number(pickGroup.current_interval_remaining_percent || 0)
      const intervalStatus = Number(pickGroup.current_interval_status || 1)
      const weeklyBasePct = Number(pickGroup.current_weekly_remaining_percent || 0)
      const weeklyBoost = Number(pickGroup.weekly_boost_permille || 1000) / 1000
      const weeklyRemainPct = Math.max(0, Math.min(200, weeklyBasePct * weeklyBoost))
      const weeklyStatus = Number(pickGroup.current_weekly_status || 1)
      return {
        ok: true, source: 'minimax', region: isCN ? 'CN' : 'GLOBAL',
        modelGroup: pickGroup.model_name,
        plan: data.current_subscribe_title || data.plan_name || data.plan || null,
        remains: data.remains_count || null,
        windows: [
          { label: '5h 滚动', usedPercent: Math.round((100 - intervalRemainPct) * 10) / 10, remainingPercent: Math.round(intervalRemainPct * 10) / 10, status: intervalStatus, statusLabel: statusLabel(intervalStatus), resetInMs: Number(pickGroup.remains_time || 0), resetAt: Date.now() + Number(pickGroup.remains_time || 0), source: 'minimax' },
          { label: '本周', usedPercent: Math.round((100 - weeklyRemainPct) * 10) / 10, remainingPercent: Math.round(weeklyRemainPct * 10) / 10, status: weeklyStatus, statusLabel: statusLabel(weeklyStatus), resetInMs: Number(pickGroup.weekly_remains_time || 0), resetAt: Number(pickGroup.weekly_end_time || 0) || (Date.now() + Number(pickGroup.weekly_remains_time || 0)), source: 'minimax' },
        ],
      }
    })
  },
}
