import fs from 'node:fs';
import path from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const errors = [];
const expectedMigrationChain = [
  '202609270001_nirdhoom_core.sql',
  '202609270002_nirdhoom_production.sql',
  '202609270003_nirdhoom_v6.sql',
  '202609270004_nirdhoom_v7.sql',
  '202610010001_field_geometry_verification.sql',
  '202610010002_verified_area_booking.sql',
  '202610010005_nirdhoom_booking_integrity.sql',
  '202610010006_nirdhoom_verification_and_settlement_integrity.sql',
  '202610010007_nirdhoom_operational_integrity.sql',
  '20261001_nirdhoom_database_hygiene.sql',
  '20261001_nirdhoom_rls_initplan_fix.sql',
  '202610020008_nirdhoom_client_write_integrity.sql',
  '202610020009_nirdhoom_security_advisor_cleanup.sql',
  '202610020010_nirdhoom_residue_pooling_and_research.sql',
  '202610020011_nirdhoom_residue_pooling_security_and_indexes.sql',
  '202610020012_nirdhoom_residue_pool_verification_gate.sql',
  '202610040001_machine_privacy_and_pool_member_visibility.sql',
  '202610040002_revoke_trigger_function_execute.sql',
  '202610050001_nirdhoom_telegram_identity.sql',
  '202610050002_nirdhoom_telegram_webhook_idempotency.sql',
  '202610050003_nirdhoom_telegram_identity_live_repair.sql',
  '20261006_nirdhoom_integrity_hardening.sql',
  '20261006_nirdhoom_residue_quantity_invariants.sql',
];
const migrationDir = path.join(root, 'supabase/migrations');
const actualMigrations = fs.readdirSync(migrationDir).filter(name => name.endsWith('.sql')).sort();
if (actualMigrations.length !== expectedMigrationChain.length ||
    actualMigrations.some((name, index) => name !== expectedMigrationChain[index])) {
  errors.push(`migration chain mismatch: expected ${expectedMigrationChain.length} chronological migrations, found ${actualMigrations.length}`);
}

const apiRouteFiles = [];
function collectApiRoutes(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) collectApiRoutes(absolute, relative);
    else if (/\\.(m?js|cjs|ts)$/.test(entry.name)) apiRouteFiles.push(relative);
  }
}
collectApiRoutes(path.join(root, 'api'));

const required = [
  'index.html',
  'package.json',
  'package-lock.json',
  'vercel.json',
  'src/main.jsx',
  'src/App.tsx',
  'src/index.css',
  'api/assistant.ts',
  'api/quote.ts',
  'api/dispatch.ts',
  'api/firms.ts',
  'api/notify/ivr.ts',
  'api/notify/telegram.ts',
  'api/notify/telegram-webhook.ts',
  'api/notify/telegram-link.ts',
  'api/notify/telegram-miniapp-auth.ts',
  'src/components/FarmerSurface/TelegramSimulator.tsx',
  'supabase/migrations/202610050001_nirdhoom_telegram_identity.sql',
  'supabase/migrations/202610050002_nirdhoom_telegram_webhook_idempotency.sql',
  'supabase/migrations/202609270001_nirdhoom_core.sql',
  'supabase/migrations/202609270002_nirdhoom_production.sql',
  'supabase/migrations/202609270003_nirdhoom_v6.sql',
  'supabase/migrations/202609270004_nirdhoom_v7.sql',
  'supabase/migrations/202610010005_nirdhoom_booking_integrity.sql',
  'supabase/migrations/202610010006_nirdhoom_verification_and_settlement_integrity.sql',
  'supabase/migrations/202610010007_nirdhoom_operational_integrity.sql',
  'supabase/migrations/202610020008_nirdhoom_client_write_integrity.sql',
  'supabase/migrations/202610020009_nirdhoom_security_advisor_cleanup.sql',
  'supabase/migrations/202610020010_nirdhoom_residue_pooling_and_research.sql',
  'supabase/migrations/202610020011_nirdhoom_residue_pooling_security_and_indexes.sql',
  'supabase/migrations/202610020012_nirdhoom_residue_pool_verification_gate.sql',
  'supabase/migrations/202610040001_machine_privacy_and_pool_member_visibility.sql',
  'supabase/migrations/202610040002_revoke_trigger_function_execute.sql',
  '.github/workflows/ci.yml',
];

for (const file of required) {
  if (!exists(file)) errors.push(`missing required file: ${file}`);
  else if (!read(file).trim()) errors.push(`empty required file: ${file}`);
}

const pkg = JSON.parse(read('package.json'));
const lock = read('package-lock.json');
const entry = read('src/main.jsx');
const app = read('src/App.tsx');
const ci = read('.github/workflows/ci.yml');
const v7 = read('supabase/migrations/202609270004_nirdhoom_v7.sql');
const v71 = read('supabase/migrations/202610010005_nirdhoom_booking_integrity.sql');
const v72 = read('supabase/migrations/202610010006_nirdhoom_verification_and_settlement_integrity.sql');
const v73 = read('supabase/migrations/202610010007_nirdhoom_operational_integrity.sql');
const v75 = read('supabase/migrations/202610020008_nirdhoom_client_write_integrity.sql');
const v76 = read('supabase/migrations/202610020009_nirdhoom_security_advisor_cleanup.sql');
const v77 = read('supabase/migrations/202610020010_nirdhoom_residue_pooling_and_research.sql');
const v78 = read('supabase/migrations/202610020011_nirdhoom_residue_pooling_security_and_indexes.sql');
const v79 = read('supabase/migrations/202610020012_nirdhoom_residue_pool_verification_gate.sql');
const v80 = read('supabase/migrations/202610040001_machine_privacy_and_pool_member_visibility.sql');
const v81 = read('supabase/migrations/202610040002_revoke_trigger_function_execute.sql');
const telegramWebhook = read('api/notify/telegram-webhook.ts');
const telegramDedupe = read('supabase/migrations/202610050002_nirdhoom_telegram_webhook_idempotency.sql');
const controller = read('src/state/useAppController.ts');
const envExample = read('.env.example');

const checks = [
  ['modular React entrypoint', entry.includes("import { App } from './App.tsx'") && entry.includes("import './index.css'")],
  ['no duplicate entrypoint', !exists('src/main.tsx')],
  ['no committed monolithic bundle', !exists('nirdhoom-app.html')],
  ['no committed build archive', !exists('nirdhoom-final.zip') && !exists('Nirdhoom-6-Telegram-Supabase-FIRMS-Telegram.zip')],
  ['no stale legacy data module', !exists('src/lib/data.js')],
  ['Node 24 runtime', pkg.engines?.node?.includes('24') && !read('vercel.json').includes('functions')],
  ['Vercel Hobby serverless function budget', apiRouteFiles.length <= 12],
  ['lockfile present', lock.includes('"lockfileVersion": 3')],
  ['Supabase RLS', /enable row level security/i.test(read('supabase/migrations/202609270002_nirdhoom_production.sql'))],
  ['server-owned booking RPC', v71.includes('reserve_clearance_booking_v2') && v71.includes('server_authoritative')],
  ['legacy booking RPC revoked', v72.includes('revoke execute on function public.reserve_clearance_booking')],
  ['verification evidence gate', v72.includes('Verification requires completed job, evidence asset and residue lot')],
  ['buyer ownership gate', v72.includes('b.profile_id=auth.uid()')],
  ['atomic residue claim', v72.includes('get diagnostics claimed = row_count')],
  ['payment webhook idempotency', v72.includes('payments_provider_reference_idx')],
  ['self-role escalation guard', v73.includes('prevent_self_privileged_profile') && v73.includes("<> 'farmer'")],
  ['GPS bounds', v73.includes('machine_locations_latitude_check') && v73.includes('machine_locations_speed_check')],
  ['evidence ownership trigger', v73.includes('validate_evidence_asset') && v73.includes('Evidence storage path must belong to its creator')],
  ['FIRMS client insert revoked', v73.includes('revoke insert on public.firms_observations from authenticated')],
  ['operator evidence policy', v73.includes('operator inserts linked evidence') && v73.includes('created_by=auth.uid()')],
  ['direct booking writes revoked', v75.includes('revoke insert, update, delete on public.bookings from authenticated') && v75.includes('reserve_clearance_booking_v2')],
  ['farmer field tampering guard', v75.includes('prevent_farmer_field_tampering') && v75.includes('Protected field attributes must be changed through an authorized workflow') && v75.includes('New farmer fields must begin in REGISTERED state with unverified boundaries')],
  ['security advisor cleanup', v76.includes('revoke all on function public.prevent_farmer_field_tampering()') && v76.includes('drop index if exists public.buyers_profile_unique_idx') && v76.includes('(select auth.uid())')],
  ['residue pooling schema', v77.includes('buyer_demands') && v77.includes('residue_pool_members') && v77.includes('impact_methodologies')],
  ['residue pooling execution restricted', v78.includes('revoke execute on function public.join_residue_pool') && v78.includes('revoke execute on function public.create_residue_pool')],
  ['machine privacy policy', v80.includes('create policy "authorized reads machines"') && v80.includes("operator_user_id=(select auth.uid())") && v80.includes("f.owner_id=(select auth.uid())")],
  ['trigger-only execute revoked', v81.includes('revoke all on function public.prevent_role_escalation()') && v81.includes('revoke all on function public.refresh_field_geometry_metrics()') && v81.includes('revoke all on function public.sync_field_boundary()')],
  ['pool member privacy policy', v80.includes('create policy "authorized read pool members"') && v80.includes("farmer_id=(select auth.uid())")],
  ['pool requires verified residue', v79.includes("l.status in ('VERIFIED','VERIFIED_NON_BURN')") && v79.includes('status=case when current_tonnes+p_quantity_tonnes >= target_tonnes then \'MATCHED\'')],
  ['demo payment disclosure', read('src/components/FieldOperator/UpiSettlementModal.tsx').includes('no money movement')],
  ['live payment routes are absent', !exists('api/payments/webhook.ts') && !exists('api/payments/initiate.ts') && read('docs/NON-PAYMENT-RELEASE-SCOPE.md').includes('Do not add provider credentials')],
  ['legacy WhatsApp webhook is absent', !exists('api/notify/whatsapp-webhook.ts')],
  ['demo onboarding disclosure', read('src/components/FarmerOnboarding/FarmerOnboarding.tsx').includes('Demo only')],
  ['demo carbon disclosure', read('src/components/CarbonMarketplace/CarbonMarketplace.tsx').includes('Illustrative carbon-market interface')],
  ['Telegram identity schema', read('supabase/migrations/202610050001_nirdhoom_telegram_identity.sql').includes('telegram_identities') && read('supabase/migrations/202610050001_nirdhoom_telegram_identity.sql').includes('consume_telegram_link_token')],
  ['Telegram webhook secret', read('api/notify/telegram-webhook.ts').includes('x-telegram-bot-api-secret-token')],
  ['Telegram secure linking', read('api/notify/telegram-link.ts').includes('SUPABASE_SERVICE_ROLE_KEY') && read('api/notify/telegram-link.ts').includes('10 * 60 * 1000')],
  ['Telegram Mini App identity verification', read('api/notify/telegram-miniapp-auth.ts').includes('WebAppData') && read('api/notify/telegram-miniapp-auth.ts').includes('auth_date') && read('api/notify/telegram-miniapp-auth.ts').includes('TELEGRAM_BOT_TOKEN')],
  ['Telegram Mini App verifier is synchronous', !read('api/notify/telegram-miniapp-auth.ts').includes('async function verifyInitData') && read('api/notify/telegram-miniapp-auth.ts').includes('const verified = verifyInitData(initData)')],
  ['Telegram outbound auth boundary', /verifyDispatcher\(req\)/.test(read('api/notify/telegram.ts'))],
  ['Telegram webhook idempotency', telegramWebhook.includes('claimTelegramUpdate') && telegramWebhook.includes('telegram_webhook_updates') && telegramWebhook.includes('duplicate: true') && telegramDedupe.includes('update_id bigint primary key')],
  ['API auth boundary', /verifyDispatcher\(req\)/.test(read('api/notify/telegram.ts')) && /verifyDispatcher\(req\)/.test(read('api/notify/ivr.ts'))],
  ['dispatch solver secret', read('api/dispatch.ts').includes('DISPATCH_SERVICE_TOKEN')],
  ['payment remains non-money-moving', !exists('api/payments') && read('docs/NON-PAYMENT-RELEASE-SCOPE.md').includes('explicitly excludes integrating a real payment or payout provider')],
  ['CI tests actual build', ci.includes('npm run syntaxcheck') && ci.includes('npm run audit') && ci.includes('npm test') && ci.includes('npm run build')],
  ['unified field job surface', exists('src/components/FieldJobs/FieldJobBoard.tsx') && app.includes("activeTab === 'FIELD_JOBS'") && read('src/components/Header.tsx').includes("'FIELD_JOBS'")],
  ['field job live chain reads', read('src/components/FieldJobs/FieldJobBoard.tsx').includes("from('jobs')") && read('src/components/FieldJobs/FieldJobBoard.tsx').includes("from('evidence_assets')") && read('src/components/FieldJobs/FieldJobBoard.tsx').includes("from('residue_lots')")],
  ['field job action queue', read('src/components/FieldJobs/FieldJobBoard.tsx').includes('Needs action') && read('src/components/FieldJobs/FieldJobBoard.tsx').includes('Deadline risk')],
  ['live weather planning adapter', read('src/components/HarvestIntelligence/HarvestIntelligence.tsx').includes('/api/weather?field_id=') && read('api/weather.ts').includes('open-meteo')],
  ['explicit farmer consent flow', read('src/components/FarmerOnboarding/FarmerOnboarding.tsx').includes("consent_type: 'farmer_network'") && read('src/components/FarmerOnboarding/FarmerOnboarding.tsx').includes("consent_status: 'GRANTED'")],
  ['settlement surfaces disclosed', read('src/components/FieldOperator/UpiSettlementModal.tsx').includes('no money movement') && !read('src/App.tsx').includes('Instant UPI Settlement')],
  ['farmer onboarding avoids financial identifiers', !read('src/components/FarmerOnboarding/FarmerOnboarding.tsx').includes('UPI ID (Preferred)')],
  ['demo data is opt-in', controller.includes("VITE_NIRDHOOM_DEMO_MODE === 'true'") && controller.includes('useState<Field[]>(DEMO_MODE ? demoSeed.fields : [])') && controller.includes('useState<Machine[]>(DEMO_MODE ? demoSeed.machines : [])') && envExample.includes('VITE_NIRDHOOM_DEMO_MODE=false')],
  ['live data loader exists', controller.includes("client.from('fields')") && controller.includes("client.from('machines')") && controller.includes('setLoadingLiveData(false)')],
  ['operator GPS telemetry', read('src/components/FieldOperator/BalerPWA.tsx').includes('navigator.geolocation.watchPosition') && read('src/components/FieldOperator/BalerPWA.tsx').includes("machine_locations")],
  ['offline evidence queue', read('src/lib/offlineEvidenceQueue.ts').includes('indexedDB') && read('src/lib/offlineEvidenceQueue.ts').includes('SHA-256')],
  ['evidence capture uploads to private storage', read('src/components/FieldOperator/BalerPWA.tsx').includes("storage.from('evidence')") && read('src/components/FieldOperator/BalerPWA.tsx').includes('evidence_assets')],
  ['API rate limiting', exists('api/_lib/rateLimit.ts') && read('api/assistant.ts').includes('rateLimit(req, res') && read('api/quote.ts').includes('rateLimit(req, res') && read('api/firms.ts').includes('rateLimit(req, res') && read('api/weather.ts').includes('rateLimit(req, res')],
  ['evidence file content validation', exists('src/lib/evidenceValidation.ts') && read('src/lib/evidenceValidation.ts').includes('isJpeg') && read('src/lib/evidenceValidation.ts').includes('MAX_EVIDENCE_BYTES') && read('src/components/FieldOperator/BalerPWA.tsx').includes('validateEvidenceFile')],
  ['unsupported payment lifecycle removed from client domain', !read('src/lib/domain.ts').includes("'PAYMENT_PROCESSING','PAID'")],
  ['verification record is not registry certificate', read('src/utils/spatialVerification.ts').includes("certificate_status: 'ILLUSTRATIVE_DEMO'") && read('src/utils/spatialVerification.ts').includes("verra_vm0042_eligible: false")],
];

for (const [name, ok] of checks) if (!ok) errors.push(`failed check: ${name}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`NIRDHOOM production audit passed: ${required.length} required files, ${checks.length} architecture/security checks.`);
