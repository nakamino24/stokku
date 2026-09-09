const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')

const root = resolve(__dirname, '../../..')

describe('zero-cost deployment contract', () => {
  it('deploys only the web application on Vercel', () => {
    const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'))
    const nextConfig = readFileSync(resolve(root, 'apps/web/next.config.mjs'), 'utf8')
    const apiClient = readFileSync(resolve(root, 'apps/web/utils/api.ts'), 'utf8')

    expect(vercel.buildCommand).toBe('pnpm vercel-build')
    expect(vercel.outputDirectory).toBe('apps/web/.next')
    expect(vercel.functions).toBeUndefined()
    expect(vercel.rewrites).toBeUndefined()
    expect(nextConfig).toContain("process.env.API_ORIGIN")
    expect(nextConfig).toContain("source: '/api/:path*'")
    expect(nextConfig).toContain('`${apiOrigin}/api/:path*`')
    expect(apiClient).toContain("process.env.NODE_ENV !== 'production'")
    expect(apiClient).toContain("process.env.NEXT_PUBLIC_API_URL")
    expect(apiClient).toContain(": '/api/v1'")
    expect(nextConfig).not.toContain('NEXT_PUBLIC_API_URL')
  })

  it('defines one free native Node Render API and no Render database', () => {
    const render = readFileSync(resolve(root, 'render.yaml'), 'utf8')
    const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

    expect(render).toMatch(/type: web/)
    expect(render).toMatch(/runtime: node/)
    expect(render).toMatch(/plan: free/)
    expect(render).toContain('pnpm render-build')
    expect(packageJson.scripts['migrate:deploy']).toContain('prisma migrate deploy')
    expect(render).not.toMatch(/^databases:/m)
    expect(render).not.toMatch(/disk:|type: worker|type: cron|type: pserv/)
  })

  it('has no active Fly deployment configuration', () => {
    expect(existsSync(resolve(root, '.github/workflows/deploy.yml'))).toBe(false)
    expect(existsSync(resolve(root, 'fly.api.toml'))).toBe(false)
    expect(existsSync(resolve(root, 'fly.web.toml'))).toBe(false)
    expect(existsSync(resolve(root, '.github/workflows/cd.yml'))).toBe(false)
    expect(existsSync(resolve(root, 'api/index.js'))).toBe(false)
  })
})
