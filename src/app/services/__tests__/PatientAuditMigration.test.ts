import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../../../../supabase/migrations/024_minimize_patient_audit_data.sql', import.meta.url),
  'utf8',
);

describe('patient audit migration privacy regression', () => {
  it('records changed field names without old/new patient values', () => {
    expect(migration).toContain("'changed_fields', changed_fields");
    expect(migration).not.toMatch(/['"]old['"]\s*,\s*OLD\.(phone|email|address|audiogram)/i);
    expect(migration).not.toMatch(/['"]new['"]\s*,\s*NEW\.(phone|email|address|audiogram)/i);
    expect(migration).not.toMatch(/'deleted'\s*,\s*jsonb_build_object/i);
  });
});
