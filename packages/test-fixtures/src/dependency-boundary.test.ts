import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('test fixture dependency boundary', () => {
  it('uses only disposable values and domain types', () => {
    const source = readFileSync(join(__dirname, 'authorization.ts'), 'utf8')
    expect(source).toContain("from '@stokku/domain'")
    expect(source).not.toMatch(/@prisma\/client|@stokku\/database|express|dotenv|DATABASE_URL|DIRECT_URL|secret|password|cookie/i)
  })
})
