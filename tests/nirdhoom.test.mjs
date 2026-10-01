import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const read = file => fs.readFileSync(`${root}/${file}`, 'utf8');
const exists = file => fs.existsSync(`${root}/${file}`);

test('production entrypoint is modular and monolith-free', () => {
  const main = read('src/main.jsx');
  assert.match(main, /App\.tsx/);
  assert.ok(!exists('src/main.tsx'));
  assert.ok(!exists('nirdhoom-app.html'));
  assert.ok(!exists('nirdhoom-final.zip'));
});

test('V7.1 server-owned booking path replaces browser quote authority', () => {
  const v71 = read('supabase/migrations/202610010005_nirdhoom_booking_integrity.sql');
  const v72 = read('supabase/migrations/202610010006_nirdhoom_verification_and_settlement_integrity.sql');
  assert.match(v71, /reserve_clearance_booking_v2/);
  assert.match(v71, /server_authoritative/);
  assert.match(v72, /revoke execute on function public\.reserve_clearance_booking/);
});

test('verification cannot become authoritative without operational evidence', () => {
  const sql = read('supabase/migrations/202610010006_nirdhoom_verification_and_settlement_integrity.sql');
  assert.match(sql, /Verification requires completed job, evidence asset and residue lot/);
  assert.match(sql, /server_evidence_count/);
  assert.match(sql, /server_lot_count/);
});

test('buyer acceptance is tenant-scoped and atomically claims residue', () => {
  const sql = read('supabase/migrations/202610010006_nirdhoom_verification_and_settlement_integrity.sql');
  assert.match(sql, /b\.profile_id=auth\.uid\(\)/);
  assert.match(sql, /get diagnostics claimed = row_count/);
  assert.match(sql, /claimed <> 1/);
});

test('operational writes have role and ownership gates', () => {
  const sql = read('supabase/migrations/202610010007_nirdhoom_operational_integrity.sql');
  assert.match(sql, /prevent_self_privileged_profile/);
  assert.match(sql, /revoke insert on public\.firms_observations from authenticated/);
  assert.match(sql, /created_by=auth\.uid\(\)/);
  assert.match(sql, /operator inserts linked evidence/);
});

test('notification endpoints require dispatcher/admin authentication', () => {
  for (const file of ['api/notify/whatsapp.ts', 'api/notify/ivr.ts']) {
    const source = read(file);
    assert.match(source, /verifyDispatcher\(req\)/);
    assert.match(source, /validPhone\(to\)/);
    assert.match(source, /AbortSignal\.timeout\(10000\)/);
  }
});

test('payment integration remains explicitly fail-closed', () => {
  const source = read('api/payments/initiate.ts');
  assert.match(source, /status\(501\)/);
  assert.match(source, /No money movement was attempted/);
  assert.doesNotMatch(source, /status:\s*['"]PAID['"]/);
});

test('CI runs audit, tests and production build on Node 24', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.match(workflow, /node-version: 24/);
  assert.match(workflow, /npm run syntaxcheck/);
  assert.match(workflow, /npm run audit/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
});

test('audit script validates the actual shipped entrypoint', () => {
  const source = read('scripts_validate.mjs');
  assert.match(source, /src\/App\.tsx/);
  assert.match(source, /no committed monolithic bundle/);
  assert.match(source, /server-owned booking RPC/);
});
