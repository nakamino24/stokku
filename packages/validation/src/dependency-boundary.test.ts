import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const packageRoot = join(__dirname, '..')
const forbiddenDependencies = ['@prisma/client', '@stokku/database', 'express', 'react', 'next', 'dotenv']

describe('validation dependency boundary', () => {
  it('contains no database, HTTP, UI, or environment dependency', () => {
    const sourceDirectory = join(packageRoot, 'src')
    for (const entry of readdirSync(sourceDirectory)) {
      if (!entry.endsWith('.ts') || entry.endsWith('.test.ts')) continue
      const source = readFileSync(join(sourceDirectory, entry), 'utf8')
      for (const dependency of forbiddenDependencies) expect(source).not.toContain(dependency)
    }
  })
})
