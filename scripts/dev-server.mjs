import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const viteBin = join(here, '..', 'node_modules', 'vite', 'bin', 'vite.js')
const isRender = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID)
const viteArgs = isRender
  ? ['preview', '--host', '0.0.0.0', '--port', process.env.PORT || '4173']
  : process.argv.slice(2)

const child = spawn(process.execPath, [viteBin, ...viteArgs], {
  env: {
    ...process.env,
    NODE_ENV: isRender ? 'production' : 'development',
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
