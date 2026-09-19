import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('contracts dependency boundary', () => {
  it('depends only on domain and validation primitives', () => {
    const source = readFileSync(join(__dirname, 'authorization.ts'), 'utf8')
    expect(source).toContain("from '@stokku/domain'")
    expect(source).toContain("from '@stokku/validation'")
    expect(source).not.toMatch(/@prisma\/client|@stokku\/database|express|react|next|dotenv/)
  })
})
