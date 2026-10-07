#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'template')
const BACKEND_CMD = (process.env.CREATE_FASTAPI_APP_CMD ?? 'uvx git+https://github.com/senzmaki/create-fastapi-app.git').split(' ')
const SKIP = new Set(['node_modules', 'dist', '.env'])

const HELP = `Usage: create-fullstack-app [project-dir] [options]

Creates <project-dir>/frontend (Vite + React + Tailwind + TypeScript with auth) and either
creates a new FastAPI backend (via create-fastapi-app) or connects to one you already have.

Options:
  --new-backend         Create a new backend in <project-dir>/backend (skips the question)
  --backend <path|url>  Use an existing backend: a local create-fastapi-app project or a running URL
  --skip-install        Don't run npm install in frontend/
  --help                Show this help

Requires: node, npm, git (uv too when creating a backend).`

// ---- args -------------------------------------------------------------------------------------
const argv = process.argv.slice(2)
const flags = new Set()
const positional = []
let backendArg = null
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--backend') backendArg = argv[++i]
  else if (argv[i].startsWith('--')) flags.add(argv[i])
  else positional.push(argv[i])
}
if (flags.has('--help')) { console.log(HELP); process.exit(0) }

// ---- helpers ----------------------------------------------------------------------------------
const fail = (msg) => { console.error(`\n✖ ${msg}`); process.exit(1) }
const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
const isUrl = (s) => /^https?:\/\//i.test(s)

function copyDir(src, dest, vars) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const from = path.join(src, entry.name)
    // npm strips .gitignore from published packages, so it ships as _gitignore
    const to = path.join(dest, entry.name === '_gitignore' ? '.gitignore' : entry.name)
    if (entry.isDirectory()) { copyDir(from, to, vars); continue }
    if (/\.(png|ico|jpe?g|woff2?)$/i.test(entry.name)) { fs.copyFileSync(from, to); continue }
    let text = fs.readFileSync(from, 'utf8')
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(k, v)
    fs.writeFileSync(to, text)
  }
}

function readEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) }
  } catch {
    return null // unreachable
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
// Pull lines through the async iterator so piped (non-TTY) input isn't dropped between questions
const lines = rl[Symbol.asyncIterator]()
const ask = async (q, def = '') => {
  process.stdout.write(def ? `${q} (${def}): ` : `${q}: `)
  const { value } = await lines.next()
  return (value ?? '').trim() || def
}
const confirm = async (q, def = true) => {
  const a = (await ask(`${q} ${def ? '[Y/n]' : '[y/N]'}`)).toLowerCase()
  return a ? a.startsWith('y') : def
}

// ---- existing-backend validation --------------------------------------------------------------
/** Local create-fastapi-app project: returns { env, port } or exits if the user declines to continue. */
async function checkLocalBackend(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail(`${dir} is not a directory.`)
  const looksRight = fs.existsSync(path.join(dir, 'app', 'main.py'))
  const hasAuth = fs.existsSync(path.join(dir, 'app', 'routers', 'auth.py'))
  if (!looksRight) {
    console.warn('! This does not look like a create-fastapi-app project (app/main.py not found).')
    if (!(await confirm('Continue anyway?', false))) process.exit(1)
  } else if (!hasAuth) {
    console.warn('! The backend was generated without authentication (app/routers/auth.py missing).')
    console.warn('  The frontend needs the /api/auth/* routes. Regenerate it with auth enabled, or continue and add them yourself.')
    if (!(await confirm('Continue anyway?', false))) process.exit(1)
  } else {
    console.log('✔ Found a create-fastapi-app backend with authentication.')
  }
  const env = readEnv(path.join(dir, '.env'))
  return { env, backendUrl: `http://localhost:${env.FASTAPI_PORT || '8000'}` }
}

/** Running backend URL: probes /api/health and the OpenAPI schema for the auth routes. */
async function checkRemoteBackend(rawUrl) {
  const base = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '')
  const health = await fetchJson(`${base}/api/health`)
  if (!health) {
    console.warn(`! Could not reach ${base}/api/health. Is the backend running?`)
    if (!(await confirm('Continue anyway?', false))) process.exit(1)
  } else if (health.ok || health.status === 500) {
    // 500 = reachable, but the backend reports its database unhealthy
    console.log(`✔ Backend reachable at ${base}${health.ok ? '' : ' (but reports an unhealthy database)'}`)
    const schema = await fetchJson(`${base}/openapi.json`)
    if (schema?.json?.paths) {
      if (schema.json.paths['/api/auth/login']) console.log('✔ Authentication routes found.')
      else {
        console.warn('! /api/auth/login not found in the backend schema; it may have been generated without auth.')
        if (!(await confirm('Continue anyway?', false))) process.exit(1)
      }
    } else {
      console.log('  (Could not read /openapi.json, probably protected by DocShield; skipping the auth-route check.)')
    }
  } else {
    console.warn(`! ${base}/api/health returned HTTP ${health.status}; this may not be a create-fastapi-app backend.`)
    if (!(await confirm('Continue anyway?', false))) process.exit(1)
  }
  return { env: {}, backendUrl: base }
}

// ---- main flow --------------------------------------------------------------------------------
let projectName = positional[0] || (await ask('Project directory'))
if (!projectName) fail('A project directory is required.')
const root = path.resolve(projectName)
if (fs.existsSync(root) && fs.readdirSync(root).length) fail(`${root} already exists and is not empty.`)

// Decide: new backend, existing local project, or existing running URL
let mode // 'new' | 'path' | 'url'
let target = backendArg
if (flags.has('--new-backend')) mode = 'new'
else if (target) mode = isUrl(target) ? 'url' : 'path'
else {
  console.log('\nDo you already have a backend?\n  1) No, create a new one (create-fastapi-app)\n  2) Yes, a local create-fastapi-app project\n  3) Yes, a running backend URL')
  const choice = await ask('Choose', '1')
  mode = { 1: 'new', 2: 'path', 3: 'url' }[choice]
  if (!mode) fail('Please choose 1, 2 or 3.')
  if (mode === 'path') target = await ask('Path to the backend project')
  if (mode === 'url') target = await ask('Backend URL', 'http://localhost:8000')
}

const required = ['node', 'npm', 'git', ...(mode === 'new' ? ['uv'] : [])]
const missing = required.filter((c) => !has(c))
if (missing.length) fail(`Missing required tools: ${missing.join(', ')}`)

let backend = { env: {}, backendUrl: 'http://localhost:8000' }
let backendDirForDev = null // directory dev.sh should start the backend from

if (mode === 'path') {
  const dir = path.resolve(target)
  backend = await checkLocalBackend(dir)
  backendDirForDev = dir
} else if (mode === 'url') {
  backend = await checkRemoteBackend(target)
}
rl.close()

fs.mkdirSync(root, { recursive: true })

if (mode === 'new') {
  // Run the interactive create-fastapi-app inside the project dir, then rename its output to backend/
  console.log('\n▶ Step 1/3: backend (answer the create-fastapi-app prompts; keep "authentication" enabled)\n')
  const [cmd, ...cmdArgs] = BACKEND_CMD
  if (spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' }).status !== 0) fail('Backend generation failed.')
  const dirs = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory())
  if (dirs.length === 1) {
    fs.renameSync(path.join(root, dirs[0].name), path.join(root, 'backend'))
    backendDirForDev = path.join(root, 'backend')
  } else {
    console.warn('! Could not locate the generated backend directory; leaving it as-is.')
  }
  backend.env = readEnv(path.join(root, 'backend', '.env'))
  backend.backendUrl = `http://localhost:${backend.env.FASTAPI_PORT || '8000'}`
}

// Frontend: copy the template, substituting names/URLs taken from the backend
console.log('\n▶ Step 2/3: frontend\n')
const appNameUi = backend.env.APP_NAME_UI || path.basename(root)
const appName = slug(backend.env.APP_NAME || path.basename(root)) || 'app'
const frontend = path.join(root, 'frontend')
copyDir(TEMPLATE, frontend, { __APP_NAME_UI__: appNameUi, __APP_NAME__: `${appName}-frontend` })
fs.writeFileSync(
  path.join(frontend, '.env'),
  `VITE_API_URL=/api\nBACKEND_URL=${backend.backendUrl}\nVITE_APP_NAME="${appNameUi}"\n`,
)
fs.copyFileSync(path.join(frontend, '.env'), path.join(frontend, '.env.example'))

// Root files
const devLines = [
  backendDirForDev && `(cd ${JSON.stringify(backendDirForDev)} && ./scripts/start_server.sh) &`,
  '(cd frontend && npm run dev) &',
].filter(Boolean)
fs.writeFileSync(
  path.join(root, 'dev.sh'),
  `#!/usr/bin/env bash
# Run ${backendDirForDev ? 'backend and frontend together' : 'the frontend'}; Ctrl+C stops ${backendDirForDev ? 'both' : 'it'}.
set -e
cd "$(dirname "$0")"
trap 'kill 0' EXIT
${devLines.join('\n')}
wait
`,
  { mode: 0o755 },
)
const backendNote = {
  new: '- `backend/` – FastAPI + PostgreSQL (generated by create-fastapi-app)',
  path: `- Backend: \`${backendDirForDev}\` (existing project, started by \`dev.sh\`)`,
  url: `- Backend: ${backend.backendUrl} (existing, not managed here; \`dev.sh\` starts only the frontend)`,
}[mode]
fs.writeFileSync(path.join(root, 'README.md'), `# ${appNameUi}

${backendNote}
- \`frontend/\` – Vite + React + Tailwind + TypeScript with auth

\`\`\`bash
./dev.sh   # frontend on :5173, /api proxied to ${backend.backendUrl}
\`\`\`

Open http://localhost:5173, register, and enter the verification code emailed by the backend
(configure \`SMTP_*\` in the backend's \`.env\`).
${mode === 'path' || mode === 'url' ? '\nIf requests fail with CORS errors, add the frontend origin to the backend\'s `CORS_ORIGINS`.\n' : ''}`)

if (!flags.has('--skip-install')) {
  console.log('\n▶ Step 3/3: installing frontend dependencies\n')
  const hasLock = fs.existsSync(path.join(frontend, 'package-lock.json'))
  if (spawnSync('npm', [hasLock ? 'ci' : 'install'], { cwd: frontend, stdio: 'inherit' }).status !== 0) {
    console.warn('! npm install failed; run it manually in frontend/.')
  }
}

console.log(`\n✔ Done!\n\n  cd ${projectName}\n  ./dev.sh\n`)
