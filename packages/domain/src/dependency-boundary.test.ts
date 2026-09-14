import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const packageRoot = join(__dirname, '..')
const repositoryRoot = join(packageRoot, '..', '..')
const forbiddenImports = ['express', '@prisma/client', '@stokku/database', 'react', 'next', 'dotenv']

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : []
  })
}

describe('domain dependency boundary', () => {
  it('does not import framework, ORM, infrastructure, UI, or environment modules', () => {
    const sources = sourceFiles(join(packageRoot, 'src'))
    for (const source of sources) {
      const contents = readFileSync(source, 'utf8')
      for (const dependency of forbiddenImports) {
        expect(contents).not.toContain(`'${dependency}'`)
        expect(contents).not.toContain(`"${dependency}"`)
      }
    }
  })

  it('keeps target package manifests narrow and inactive in application runtimes', () => {
    const manifests = [
      ['domain', join(repositoryRoot, 'packages', 'domain', 'package.json'), []],
      ['validation', join(repositoryRoot, 'packages', 'validation', 'package.json'), ['@stokku/domain', 'zod']],
      ['contracts', join(repositoryRoot, 'packages', 'contracts', 'package.json'), ['@stokku/domain', '@stokku/validation']],
      ['test-fixtures', join(repositoryRoot, 'packages', 'test-fixtures', 'package.json'), ['@stokku/domain']],
    ] as const

    for (const [, manifestPath, allowedDependencies] of manifests) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { dependencies?: Record<string, string> }
      expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual([...allowedDependencies].sort())
    }

    for (const application of ['apps/api', 'apps/web']) {
      const manifest = JSON.parse(readFileSync(join(repositoryRoot, application, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>
      }
      // Gate 5 approval: apps/api may consume target packages inside the isolated
      // target-authorization adapter only. apps/web must never import them.
      if (application === 'apps/api') {
        for (const allowedTargetPackage of ['@stokku/domain', '@stokku/validation']) {
          expect(manifest.dependencies?.[allowedTargetPackage]).toBeDefined()
        }
        for (const forbiddenTargetPackage of ['@stokku/contracts', '@stokku/test-fixtures']) {
          expect(manifest.dependencies?.[forbiddenTargetPackage]).toBeUndefined()
        }
      } else {
        for (const targetPackage of ['@stokku/domain', '@stokku/contracts', '@stokku/validation', '@stokku/test-fixtures']) {
          expect(manifest.dependencies?.[targetPackage]).toBeUndefined()
        }
      }

      const sourceRoot = join(repositoryRoot, application, 'src')
      if (!existsSync(sourceRoot)) continue
      const sources = sourceFiles(sourceRoot)
      for (const source of sources) {
        const contents = readFileSync(source, 'utf8')
        if (
          (application === 'apps/api' && source.includes('target-authorization')) ||
          source.endsWith('index.ts')
        ) continue
        for (const targetPackage of ['@stokku/domain', '@stokku/contracts', '@stokku/validation', '@stokku/test-fixtures']) {
          expect(contents).not.toContain(`'${targetPackage}'`)
          expect(contents).not.toContain(`"${targetPackage}"`)
        }
      }
    }
  })
})
