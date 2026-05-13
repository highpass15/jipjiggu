import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const viteBin = join(here, '..', 'node_modules', 'vite', 'bin', 'vite.js')
const isRender = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_ID)
const distIndex = join(here, '..', 'dist', 'index.html')
const viteArgs = isRender
  ? ['preview', '--host', '0.0.0.0', '--port', process.env.PORT || '4173']
  : process.argv.slice(2)
const runtimeEnv = {
  ...process.env,
  NODE_ENV: isRender ? 'production' : 'development',
}

if (isRender && !existsSync(distIndex)) {
  const build = spawn(process.execPath, [viteBin, 'build'], {
    env: runtimeEnv,
    stdio: 'inherit',
  })

  build.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    if (code && code !== 0) {
      process.exit(code)
      return
    }

    startVite()
  })
} else {
  startVite()
}

function startVite() {
  const child = spawn(process.execPath, [viteBin, ...viteArgs], {
    env: runtimeEnv,
    stdio: 'inherit',
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}
