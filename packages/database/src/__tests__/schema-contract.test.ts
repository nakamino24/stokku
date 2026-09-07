import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('PostgreSQL inventory schema contract', () => {
  const packageRoot = resolve(__dirname, '../..');
  const schema = readFileSync(resolve(packageRoot, 'prisma/schema.prisma'), 'utf8');
  const lock = readFileSync(resolve(packageRoot, 'prisma/migrations/migration_lock.toml'), 'utf8');
  const baseline = readFileSync(
    resolve(packageRoot, 'prisma/migrations/20260907000000_postgresql_baseline/migration.sql'),
    'utf8',
  );

  it('uses PostgreSQL and exact fractional quantity columns', () => {
    expect(schema).toContain('provider = "postgresql"');
    expect(lock).toContain('provider = "postgresql"');
    expect(schema).toMatch(/onHand\s+Decimal\s+@default\(0\) @db\.Decimal\(18, 6\)/);
    expect(schema).toMatch(/available\s+Decimal\s+@default\(0\) @db\.Decimal\(18, 6\)/);
  });

  it('installs balance invariants and an immutable ledger trigger', () => {
    expect(baseline).toContain('"available" = "onHand" - "allocated" - "hold"');
    expect(baseline).toContain('CREATE TRIGGER "StockMovement_immutable"');
    expect(baseline).toContain('NULLS NOT DISTINCT');
  });
});
