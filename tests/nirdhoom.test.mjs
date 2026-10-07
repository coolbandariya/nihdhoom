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
  const telegram = read('api/notify/telegram.ts');
  assert.match(telegram, /verifyDispatcher\(req\)/);
  assert.match(telegram, /validChatId\(chat_id\)/);
  assert.match(telegram, /AbortSignal\.timeout\(10000\)/);

  const ivr = read('api/notify/ivr.ts');
  assert.match(ivr, /verifyDispatcher\(req\)/);
  assert.match(ivr, /validPhone\(to\)/);
  assert.match(ivr, /AbortSignal\.timeout\(10000\)/);
});

test('payment integration remains explicitly fail-closed', () => {
  const scope = read('docs/NON-PAYMENT-RELEASE-SCOPE.md');
  assert.match(scope, /explicitly excludes integrating a real payment or payout provider/);
  assert.match(scope, /Do not add provider credentials/);
  assert.ok(!exists('api/payments/initiate.ts'));
  assert.ok(!exists('api/payments/webhook.ts'));
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


test('V7.5 blocks direct booking writes and farmer field tampering', () => {
  const sql = read('supabase/migrations/202610020008_nirdhoom_client_write_integrity.sql');
  assert.match(sql, /revoke insert, update, delete on public\.bookings from authenticated/);
  assert.match(sql, /prevent_farmer_field_tampering/);
  assert.match(sql, /Protected field attributes must be changed through an authorized workflow/);
  assert.match(sql, /New farmer fields must begin in REGISTERED state with unverified boundaries/);
});

test('simulation surfaces do not claim real transactions', () => {
  assert.match(read('src/components/FieldOperator/UpiSettlementModal.tsx'), /no money movement/i);
  assert.match(read('src/components/FarmerOnboarding/FarmerOnboarding.tsx'), /Demo only/);
  assert.match(read('src/components/CarbonMarketplace/CarbonMarketplace.tsx'), /Illustrative carbon-market interface/);
});


test('demo operational data is opt-in and production starts empty', () => {
  const controller = read('src/state/useAppController.ts');
  assert.match(controller, /VITE_NIRDHOOM_DEMO_MODE === 'true'/);
  assert.match(controller, /useState<Field\[\]>\(DEMO_MODE \? demoSeed\.fields : \[\]\)/);
  assert.match(controller, /useState<Machine\[\]>\(DEMO_MODE \? demoSeed\.machines : \[\]\)/);
  assert.match(controller, /useState<BurnEvent\[\]>\(DEMO_MODE \? demoSeed\.fireEvents : \[\]\)/);
  assert.match(read('.env.example'), /VITE_NIRDHOOM_DEMO_MODE=false/);
});


test('live dashboard KPIs are derived from current records', () => {
  const app = read('src/App.tsx');
  assert.match(app, /const acresScheduled = fields\.reduce/);
  assert.match(app, /acresScheduled=\{acresScheduled\}/);
  assert.doesNotMatch(app, /acresScheduled=\{88\.4\}/);
});

test('payment KPI plumbing and browser alerts stay out of the release UI', () => {
  const dashboard = read('src/components/LiveKPIDashboard.tsx');
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  const dispatch = read('src/components/OpsConsole/VRPDispatchPanel.tsx');
  assert.doesNotMatch(dashboard, /totalPayoutInr/);
  assert.doesNotMatch(landing, /totalPayoutInr/);
  assert.doesNotMatch(dispatch, /window\.alert/);
  assert.match(dispatch, /role="alert"/);
});

test('Telegram is the primary farmer channel and legacy WhatsApp webhook is absent', () => {
  assert.ok(!exists('api/notify/whatsapp-webhook.ts'));
  assert.match(read('docs/TELEGRAM-INTEGRATION.md'), /primary conversational farmer channel/);
  assert.match(read('.env.example'), /TELEGRAM_BOT_TOKEN/);
});

test('onboarding does not collect financial identifiers while payment is disabled', () => {
  const onboarding = read('src/components/FarmerOnboarding/FarmerOnboarding.tsx');
  assert.doesNotMatch(onboarding, /UPI ID \(Preferred\)/);
  assert.match(onboarding, /do not ask for a real UPI ID or bank account/);
});

test('live field normalization does not invent Punjab coordinates', () => {
  const domain = read('src/lib/domain.ts');
  assert.match(domain, /f\.center_lat \?\? f\.lat \?\? 0/);
  assert.match(domain, /f\.center_lng \?\? f\.lng \?\? 0/);
});


test('residue pooling is backed by verified lots and authenticated RPCs', () => {
  const schema = read('supabase/migrations/202610020010_nirdhoom_residue_pooling_and_research.sql');
  const security = read('supabase/migrations/202610020011_nirdhoom_residue_pooling_security_and_indexes.sql');
  const gate = read('supabase/migrations/202610020012_nirdhoom_residue_pool_verification_gate.sql');
  assert.match(schema, /buyer_demands/);
  assert.match(schema, /residue_pool_members/);
  assert.match(security, /revoke execute on function public\.join_residue_pool/);
  assert.match(gate, /VERIFIED_NON_BURN/);
});

test('operator PWA has real GPS and offline evidence primitives', () => {
  const source = read('src/components/FieldOperator/BalerPWA.tsx');
  const queue = read('src/lib/offlineEvidenceQueue.ts');
  assert.match(source, /navigator\.geolocation\.watchPosition/);
  assert.match(source, /storage\.from\('evidence'\)/);
  assert.match(source, /evidence_assets/);
  assert.match(queue, /indexedDB/);
  assert.match(queue, /SHA-256/);
});

test('verification UI cannot mint a registry-grade carbon certificate', () => {
  const source = read('src/utils/spatialVerification.ts');
  assert.match(source, /certificate_status: 'ILLUSTRATIVE_DEMO'/);
  assert.match(source, /verra_vm0042_eligible: false/);
  assert.match(source, /NOT_A_CRYPTOGRAPHIC_CERTIFICATE/);
});


test('API public surfaces have lightweight abuse protection', () => {
  const rateLimit = read('api/_lib/rateLimit.ts');
  assert.match(rateLimit, /X-RateLimit-Limit/);
  assert.match(rateLimit, /Retry-After/);
  for (const file of ['api/assistant.ts', 'api/quote.ts', 'api/firms.ts', 'api/weather.ts']) {
    assert.match(read(file), /rateLimit\(req, res/);
  }
});

test('field evidence upload rejects unsafe file types and sizes', () => {
  const validation = read('src/lib/evidenceValidation.ts');
  assert.match(validation, /12 \* 1024 \* 1024/);
  assert.match(validation, /image\/jpeg/);
  assert.match(validation, /image\/png/);
  assert.match(validation, /image\/webp/);
  assert.match(validation, /isJpeg/);
  assert.match(validation, /isPng/);
  assert.match(validation, /isWebp/);
  assert.match(read('src/components/FieldOperator/BalerPWA.tsx'), /validateEvidenceFile/);
});

test('Telegram identity linking is authenticated and server-owned', () => {
  const migration = read('supabase/migrations/202610050001_nirdhoom_telegram_identity.sql');
  const linkApi = read('api/notify/telegram-link.ts');
  const webhook = read('api/notify/telegram-webhook.ts');
  assert.match(migration, /telegram_identities/);
  assert.match(migration, /telegram_link_tokens/);
  assert.match(migration, /consume_telegram_link_token/);
  assert.match(migration, /revoke all on function public\.consume_telegram_link_token/);
  assert.match(migration, /grant execute on function public\.consume_telegram_link_token[\s\S]*to service_role/);
  assert.match(linkApi, /auth\/v1\/user/);
  assert.match(linkApi, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(linkApi, /10 \* 60 \* 1000/);
  assert.match(webhook, /x-telegram-bot-api-secret-token/);
  assert.match(webhook, /consume_telegram_link_token/);
});

test('Telegram webhook is idempotent and server-persisted', () => {
  const migration = read('supabase/migrations/202610050002_nirdhoom_telegram_webhook_idempotency.sql');
  const source = read('api/notify/telegram-webhook.ts');
  assert.match(migration, /telegram_webhook_updates/);
  assert.match(migration, /update_id bigint primary key/);
  assert.match(migration, /enable row level security/);
  assert.match(source, /claimTelegramUpdate/);
  assert.match(source, /telegram_webhook_updates/);
  assert.match(source, /response.status === 409/);
  assert.match(source, /duplicate: true/);
});

test('Telegram outbound notifications remain dispatcher/admin-only', () => {
  const source = read('api/notify/telegram.ts');
  assert.match(source, /verifyDispatcher\(req\)/);
  assert.match(source, /TELEGRAM_BOT_TOKEN/);
  assert.match(source, /validChatId/);
  assert.match(source, /AbortSignal\.timeout\(10000\)/);
});

test('Telegram Mini App identity is verified server-side', () => {
  const source = read('api/notify/telegram-miniapp-auth.ts');
  assert.match(source, /WebAppData/);
  assert.match(source, /auth_date/);
  assert.match(source, /10 \* 60/);
  assert.match(source, /TELEGRAM_BOT_TOKEN/);
  assert.match(source, /telegram_user_id/);
  assert.match(source, /const verified = verifyInitData\(initData\)/);
  assert.doesNotMatch(source, /async function verifyInitData/);
  assert.match(source, /Telegram account is not linked to a NIRDHOOM profile/);
});


test('competition demo ends with a field clearance passport and avoids unsupported claims', () => {
  const demo = read('src/components/DemoWalkthrough.tsx');
  const passport = read('src/components/VerificationLayer/ClearancePassport.tsx');
  assert.match(demo, /ClearancePassport/);
  assert.match(demo, /trust proof/i);
  assert.doesNotMatch(demo, /subsidised balers/);
  assert.doesNotMatch(demo, /late-sowing penalty exposure/);
  assert.match(passport, /Field Clearance Passport/);
  assert.match(passport, /not a legal certificate/);
  assert.match(passport, /payment receipt/);
});


test('research-backed competition story', () => {
  const home = read('src/components/CommandCenter/CommandCenter.tsx');
  const center = read('src/components/PitchDefense/CompetitionCenter.tsx');
  assert.match(home, /86%/);
  assert.match(home, /15%/);
  assert.match(center, /WHY THIS PROBLEM, WHY NOW/);
  assert.match(center, /Impact/);
  assert.match(center, /Feasibility/);
  assert.match(center, /Technical craft/);
});

test('competition center is wired for both RIDE and WarriorHacks', () => {
  const header = read('src/components/Header.tsx');
  const app = read('src/App.tsx');
  const center = read('src/components/PitchDefense/CompetitionCenter.tsx');
  assert.match(header, /COMPETITION_CENTER/);
  assert.match(header, /Competition Pitch/);
  assert.match(app, /const CompetitionCenter = lazy/);
  assert.match(app, /activeTab === 'COMPETITION_CENTER'/);
  assert.match(center, /RIDE HACK/);
  assert.match(center, /WARRIORHACKS 2\.0/);
  for (const step of ['Field', 'Book', 'Machine', 'Proof', 'Parali']) assert.match(center, new RegExp(step));
  assert.match(center, /Real payment or payout movement/);
});

test('visible competition surfaces stay claim-safe', () => {
  const sources = [
    read('src/components/OpsConsole/OpsMap.tsx'),
    read('src/components/Animated/BentoGrid.tsx'),
    read('src/components/PitchDefense/JudgePitchDrawer.tsx'),
    read('src/components/AgenticConsole/AgenticCommandCenter.tsx'),
    read('src/components/ThreeD/BalerModel3D.tsx'),
  ].join('\n');
  assert.doesNotMatch(sources, /50-80% CRM ASSET/i);
  assert.doesNotMatch(sources, /14,200\+ Balers/i);
  assert.doesNotMatch(sources, /already-subsidised crop residue machinery/i);
  assert.doesNotMatch(sources, /UPI payout/i);
  assert.match(read('src/components/CarbonMarketplace/CarbonMarketplace.tsx'), /Carbon Market Simulator/);
});


test('application uses one field-first theme and no theme switcher', () => {
  const html = read('index.html');
  const header = read('src/components/Header.tsx');
  const css = read('src/index.css');
  const theme = read('src/styles/theme.css');
  assert.match(html, /<html lang="en" data-theme="kisan">/);
  assert.doesNotMatch(html, /nirdhoom-theme/);
  assert.doesNotMatch(header, /ThemeToggle/);
  assert.ok(!exists('src/components/ThemeToggle.tsx'));
  assert.match(css, /html\[data-theme="kisan"\]/);
  assert.match(theme, /html\[data-theme="kisan"\]/);
  assert.doesNotMatch(theme, /html\[data-theme="dark"\] \{/);
  assert.doesNotMatch(theme, /html\[data-theme="light"\] \{/);
});

test('Hindi text converter is present and uses bounded transliteration requests', () => {
  const converter = read('src/components/FarmerSurface/HindiTextConverter.tsx');
  const telegram = read('src/components/FarmerSurface/TelegramSimulator.tsx');
  assert.match(converter, /hi-t-i0-und/);
  assert.match(converter, /AbortController/);
  assert.match(converter, /7000/);
  assert.match(converter, /Roman Hindi/);
  assert.match(telegram, /HindiTextConverter/);
});

test('farmer onboarding does not render two competing surfaces for one tab', () => {
  const app = read('src/App.tsx');
  const matches = app.match(/activeTab === 'FARMER_ONBOARDING'/g) || [];
  assert.equal(matches.length, 1);
});


test('live field identity keeps the Supabase UUID separate from the display id', () => {
  const types = read('src/types/index.ts');
  const controller = read('src/state/useAppController.ts');
  const booking = read('src/components/ClearanceBooking/ClearanceBooking.tsx');
  const weather = read('src/components/HarvestIntelligence/HarvestIntelligence.tsx');
  const audit = read('src/components/VerificationLayer/SatelliteAudit.tsx');
  assert.match(types, /dbId\?: string/);
  assert.match(controller, /dbId: f\.dbId/);
  assert.match(booking, /p_field_id: selected\.dbId \|\| selected\.id/);
  assert.match(weather, /selectedWeatherField\.dbId \|\| selectedWeatherField\.id/);
  assert.match(audit, /p_field_id: field\.dbId \|\| field\.id/);
});


test('Telegram health endpoint is fail-closed when server configuration is missing', () => {
  const source = read('api/notify/telegram-webhook.ts');
  assert.match(source, /const configured = Boolean\(/);
  assert.match(source, /TELEGRAM_WEBHOOK_SECRET/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /res\.status\(configured \? 200 : 503\)/);
});

test('Telegram Mini App refreshes server-side identity activity after verification', () => {
  const source = read('api/notify/telegram-miniapp-auth.ts');
  assert.match(source, /last_seen_at/);
  assert.match(source, /method: 'PATCH'/);
  assert.match(source, /telegram_user_id=eq\./);
});

// Competition readiness guards are intentionally source-level and deployment-independent.

test('residue pool RPC cannot over-commit a verified lot and definer search paths are pinned', () => {
  const sql = read('supabase/migrations/20261006_nirdhoom_integrity_hardening.sql');
  assert.match(sql, /l\.quantity_tonnes - coalesce/);
  assert.match(sql, /no verified residue lot with sufficient uncommitted quantity/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke execute on function public\.join_residue_pool/);
});


test('audit command includes latest Supabase integrity hardening checks', () => {
  const pkg = JSON.parse(read('package.json'));
  const audit = read('scripts_integrity_validate.mjs');
  assert.match(pkg.scripts.audit, /scripts_integrity_validate\.mjs/);
  assert.match(audit, /20261006_nirdhoom_integrity_hardening\.sql/);
  assert.match(audit, /l\.quantity_tonnes - coalesce/);
  assert.match(audit, /set search_path = ''/);
});


test('legacy visual shells cannot return to the product UI', () => {
  const app = read('src/App.tsx');
  const css = read('src/index.css');
  assert.doesNotMatch(app, /ParticleField/);
  assert.doesNotMatch(css, /data-theme="dark"/);
  assert.doesNotMatch(css, /data-theme="light"/);
  assert.doesNotMatch(css, /field-theme-toggle/);
  assert.doesNotMatch(read('src/styles/theme.css'), /data-theme="dark"/);
  assert.doesNotMatch(read('src/styles/theme.css'), /data-theme="light"/);
  assert.ok(!exists('src/components/ThemeToggle.tsx'));
  assert.ok(!exists('src/styles/navbar.css'));
});

test('performance architecture keeps heavy workspace libraries off the shell', () => {
  const app = read('src/App.tsx');
  const header = read('src/components/Header.tsx');
  const prefetch = read('src/lib/workspacePrefetch.ts');
  const vite = read('vite.config.ts');
  assert.match(app, /lazy\(\(\) => import\('\.\/components\/OpsConsole\/OpsMap'/);
  assert.doesNotMatch(app, /import \{ OpsMap \}/);
  assert.match(header, /startTransition/);
  assert.match(header, /prefetchWorkspace/);
  assert.match(prefetch, /OpsMap/);
  assert.match(prefetch, /SatelliteEarth3D/);
  assert.match(vite, /cssCodeSplit: true/);
});

test('image optimization keeps JSX valid and the primary hero eager', () => {
  const files = [
    'src/components/CommandCenter/CommandCenter.tsx',
    'src/components/Landing/ImpactStats.tsx',
    'src/components/Landing/AgenticLanding.tsx',
    'src/components/FieldOperator/BalerPWA.tsx',
    'src/components/OpsConsole/FieldDetailDrawer.tsx',
    'src/components/OfftakeAndForecast/HarvestForecast.tsx',
    'src/components/VerificationLayer/SatelliteAudit.tsx',
    'src/components/FarmerOnboarding/FarmerOnboarding.tsx',
    'src/components/OfftakeAndForecast/MultiOfftakeAuction.tsx',
    'src/components/FieldOperator/UpiSettlementModal.tsx',
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /\/ loading=/);
  }
  assert.doesNotMatch(read('src/components/CommandCenter/CommandCenter.tsx'), /home-hero-image"[^>]*loading="lazy"/);
});


test('farmer OTP uses React Bits CodeSlots with live Supabase verification wiring', () => {
  const onboarding = read('src/components/FarmerOnboarding/FarmerOnboarding.tsx');
  const slots = read('src/components/FarmerOnboarding/CodeSlots.tsx');
  const css = read('src/components/FarmerOnboarding/CodeSlots.css');
  const pkg = JSON.parse(read('package.json'));
  const lock = read('package-lock.json');
  assert.match(onboarding, /import CodeSlots from '\.\/CodeSlots'/);
  assert.match(onboarding, /onComplete=\{verifyLiveOtp\}/);
  assert.match(onboarding, /accentColor="#F2A900"/);
  assert.match(onboarding, /verifyOtp\(\{/);
  assert.match(slots, /autoComplete="one-time-code"/);
  assert.match(slots, /HugeiconsIcon/);
  assert.match(css, /prefers-reduced-motion/);
  assert.equal(pkg.dependencies.motion, '^12.23.21');
  assert.equal(pkg.dependencies['@hugeicons/react'], '^1.1.10');
  assert.equal(pkg.dependencies['@hugeicons/core-free-icons'], '^4.3.3');
  assert.match(lock, /node_modules\/motion/);
  assert.match(lock, /node_modules\/@hugeicons\/react/);
});


test('React Bits Stepper is integrated into farmer onboarding progress', () => {
  const onboarding = read('src/components/FarmerOnboarding/FarmerOnboarding.tsx');
  const stepper = read('src/components/FarmerOnboarding/Stepper.tsx');
  const css = read('src/components/FarmerOnboarding/Stepper.css');
  assert.match(onboarding, /import Stepper, \{ Step \} from '\.\/Stepper'/);
  assert.match(onboarding, /<Stepper/);
  assert.match(onboarding, /initialStep=\{stepIndex \+ 1\}/);
  assert.match(onboarding, /disableStepIndicators/);
  assert.match(onboarding, /STEPS\.map\(\(step\) => \(/);
  assert.match(stepper, /from 'motion\/react'/);
  assert.match(stepper, /onFinalStepCompleted/);
  assert.match(stepper, /export function Step/);
  assert.match(css, /farmer-onboarding-stepper/);
  assert.match(css, /prefers-reduced-motion/);
});


test('React Bits Pro globe registry and operational map integration stay wired', () => {
  const components = read('components.json');
  const env = read('.env.example');
  const globe = read('src/components/react-bits/globe.tsx');
  const map = read('src/components/OpsConsole/OpsMap.tsx');
  assert.match(components, /@reactbits-starter/);
  assert.match(components, /@reactbits-pro/);
  assert.match(components, /REACTBITS_LICENSE_KEY/);
  assert.match(env, /REACTBITS_LICENSE_KEY=/);
  assert.match(globe, /Interactive 3D globe with animated arcs/);
  assert.match(globe, /autoRotateSpeed/);
  assert.match(globe, /arcAnimationDuration/);
  assert.match(map, /from '..\/react-bits\/globe'/);
  assert.match(map, /Network Globe/);
  assert.match(map, /mapMode === 'globe'/);
  assert.match(map, /Field GIS/);
});


test('homepage uses curated agriculture photography and visual storytelling', () => {
  const home = read('src/components/CommandCenter/CommandCenter.tsx');
  const css = read('src/index.css');
  assert.match(home, /from '..\/Animated\/Spotlight'/);
  assert.match(home, /upload\.wikimedia\.org/);
  assert.match(home, /home-visual-rail/);
  assert.match(home, /home-photo-credit/);
  assert.match(home, /fetchPriority="high"/);
  assert.match(css, /home-hero-spotlight/);
  assert.match(css, /home-visual-grid/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});


test('provider and demo-label contracts stay truthful', () => {
  const assistant = read('api/assistant.ts');
  const env = read('.env.example');
  const map = read('src/components/OpsConsole/OpsMap.tsx');
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  assert.match(assistant, /GROQ_API_KEY/);
  assert.match(assistant, /api\.groq\.com\/openai\/v1/);
  assert.match(assistant, /askOpenAI/);
  assert.match(env, /GROQ_MODEL=llama-3\.3-70b-versatile/);
  assert.doesNotMatch(map, /Subsidised Balers/);
  assert.doesNotMatch(map, /External Fire Storm/);
  assert.doesNotMatch(landing, /Carbon Credit Marketplace/);
  assert.match(landing, /Carbon Market Simulator/);
});

test('satellite and landing evidence labels stay truthful', () => {
  const satellite = read('src/components/ThreeD/SatelliteEarth3D.tsx');
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  assert.doesNotMatch(satellite, /NASA FIRMS LIVE/);
  assert.match(satellite, /FIRMS \/ VIIRS layer/);
  assert.doesNotMatch(landing, /Subsidised CRM Baler Fleet Active/);
  assert.match(landing, /Registered baler fleet operating/);
});

test('ops telemetry does not invent live defaults', () => {
  const telemetry = read('src/components/LiveKPIDashboard.tsx');
  assert.match(telemetry, /acresScheduled = 0/);
  assert.match(telemetry, /co2Avoided = 0/);
  assert.match(telemetry, /activeMachines = 0/);
  assert.match(telemetry, /fireEventsOutsideCount = 0/);
  assert.match(telemetry, /demoMode = false/);
  assert.doesNotMatch(telemetry, /NIRDHOOM Live Ops Telemetry/);
  assert.match(telemetry, /NIRDHOOM Ops Telemetry/);
});

test('landing telemetry is zero-by-default and demo-aware', () => {
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  assert.match(landing, /demoMode\?: boolean/);
  assert.match(landing, /demoMode = false/);
  assert.match(landing, /acresScheduled = 0/);
  assert.match(landing, /activeMachines = 0/);
  assert.match(landing, /status: 'DEMO DISPATCH'/);
  assert.match(landing, /time: 'Demo'/);
  assert.match(landing, /demoMode=\{demoMode\}/);
});

test('Telegram UI does not fall back to generic t.me', () => {
  const telegram = read('src/components/FarmerSurface/TelegramSimulator.tsx');
  assert.doesNotMatch(telegram, /'https:\/\/t\.me'/);
  assert.match(telegram, /Telegram bot is not configured/);
  assert.match(telegram, /href=\{botUrl \|\| undefined\}/);
});
test('landing district ticker records are explicitly demo-labelled', () => {
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  assert.doesNotMatch(landing, /status: '(?:ACTIVE DISPATCH|VRP RE-ROUTING|HARVEST SPIKE)'/);
  assert.doesNotMatch(landing, /time: '(?:1m ago|2m ago|3m ago|5m ago|7m ago)'/);
  assert.match(landing, /DEMO RE-ROUTING/);
  assert.match(landing, /DEMO HARVEST SIGNAL/);
});


test('field-first polish removes high-risk legacy landing and Telegram UI regressions', () => {
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  const telegram = read('src/components/FarmerSurface/TelegramSimulator.tsx');
  const telemetry = read('src/components/AgenticConsole/AgenticTelemetryToast.tsx');
  assert.doesNotMatch(landing, /bg-gradient-to-b from=\["']#020409/i);
  assert.match(landing, /field-first, with React Bits spotlight/i);
  assert.match(telegram, /Configure VITE_TELEGRAM_BOT_USERNAME to enable direct opening/);
  assert.match(telegram, /cursor-not-allowed/);
  assert.doesNotMatch(telemetry, /Real-time Telemetry Stream/);
  assert.match(telemetry, /operational signal stream/);
});


test('landing and visual pipeline avoid unsupported machinery, fire, and buyer claims', () => {
  const landing = read('src/components/Landing/AgenticLanding.tsx');
  const beam = read('src/components/Animated/AnimatedBeam.tsx');
  const earth = read('src/components/ThreeD/SatelliteEarth3D.tsx');
  assert.doesNotMatch(landing, /NASA FIRMS 375m Audit/);
  assert.doesNotMatch(landing, /Subsidised Baler Twin/);
  assert.doesNotMatch(landing, /₹3,200\/T/);
  assert.match(landing, /not a no-burn certificate/);
  assert.match(beam, /Registered \/ available fleet/);
  assert.match(beam, /Illustrative workflow only/);
  assert.match(earth, /supporting evidence only/);
  assert.doesNotMatch(earth, /Zero Burn Shield/);
});


test('field-first UI kit and open-source interaction surfaces remain wired', () => {
  const css = read('src/index.css');
  const header = read('src/components/Header.tsx');
  const harvest = read('src/components/OfftakeAndForecast/HarvestForecast.tsx');
  const auction = read('src/components/OfftakeAndForecast/MultiOfftakeAuction.tsx');
  assert.match(css, /NIRDHOOM UI KIT v2/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /spotlight/);
  assert.match(header, /backdrop-blur-xl/);
  assert.match(header, /Field-first crop-residue network/);
  assert.match(harvest, /field-first cards/);
  assert.match(auction, /field-first/);
});


test('consent withdrawal is server-authorized and records revocation', () => {
  const migration = read('supabase/migrations/202610070001_nirdhoom_consent_withdrawal.sql');
  const onboarding = read('src/components/FarmerOnboarding/FarmerOnboarding.tsx');
  assert.match(migration, /revoke_farmer_network_consent/);
  assert.match(migration, /profile_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /revoked_at/);
  assert.match(onboarding, /Withdraw consent/);
  assert.match(onboarding, /consent_status: 'REVOKED'/);
});

test('operator surface distinguishes stale GPS readings', () => {
  const source = read('src/components/FieldOperator/BalerPWA.tsx');
  assert.match(source, /gpsStale/);
  assert.match(source, /stale \$\{gpsAgeSeconds\}s ago/);
  assert.match(source, /GPS reading is stale/);
});
