import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
import { hashPassword, isLegacyBcryptHash, verifyPassword } from '../password-hashing'

jest.mock('argon2', () => ({
  argon2id: 2,
  hash: jest.fn(),
  verify: jest.fn(),
  needsRehash: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

describe('password hashing', () => {
  it('uses Argon2id for new password hashes', async () => {
    (argon2.hash as jest.Mock).mockResolvedValue('argon2-hash')

    await expect(hashPassword('Password1')).resolves.toBe('argon2-hash')
    expect(argon2.hash).toHaveBeenCalledWith(
      'Password1',
      expect.objectContaining({ type: 2, memoryCost: 65536, timeCost: 3, parallelism: 1 }),
    )
  })

  it('recognizes only supported bcrypt prefixes as legacy hashes', () => {
    expect(isLegacyBcryptHash('$2a$12$abcdefghijklmnopqrstuu')).toBe(true)
    expect(isLegacyBcryptHash('$2b$12$abcdefghijklmnopqrstuu')).toBe(true)
    expect(isLegacyBcryptHash('$argon2id$v=19$m=65536,t=3,p=1$hash')).toBe(false)
  })

  it('verifies a legacy bcrypt hash and marks it for rehashing', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true)

    await expect(verifyPassword('Password1', '$2b$12$abcdefghijklmnopqrstuu')).resolves.toEqual({
      valid: true,
      needsRehash: true,
    })
    expect(bcrypt.compare).toHaveBeenCalledWith('Password1', '$2b$12$abcdefghijklmnopqrstuu')
  })

  it('verifies Argon2id hashes using the configured policy', async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(true)
    ;(argon2.needsRehash as jest.Mock).mockReturnValue(false)

    await expect(verifyPassword('Password1', '$argon2id$v=19$m=65536,t=3,p=1$hash')).resolves.toEqual({
      valid: true,
      needsRehash: false,
    })
    expect(argon2.verify).toHaveBeenCalledWith(
      '$argon2id$v=19$m=65536,t=3,p=1$hash',
      'Password1',
    )
  })
})
