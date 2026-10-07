# NIRDHOOM Release Readiness — 2026-10-07

## Purpose

This is the operational release gate for the current prototype/integration foundation. It separates work that can be completed in-repository from checks that require real credentials, deployed providers, real phones, or field devices.

## P0 — repository and UI readiness

- [x] Unify the product under a light, farmer-centric visual system.
- [x] Remove legacy dark/cyber surfaces from common application panels through the shared design system.
- [x] Keep the primary navigation stable: Home → My Fields → Book Parali Pickup → Track My Machine → Parali Market → More.
- [x] Redesign telemetry as a logistics/product activity card rather than a sci-fi HUD.
- [x] Use curated local imagery for core command-center photography.
- [x] Add restrained contextual accents instead of a different colour theme per workspace.
- [x] Synchronize the database release ledger with the current migration chain.
- [ ] Run the local validation suite on the exact release commit.
- [ ] Verify the deployed Vercel build matches the tested commit.

## P0 — real Supabase validation (requires deployed project and test accounts)

Create isolated accounts for: Farmer, Operator, Dispatcher, Verifier, Buyer, Admin.

For each account, verify:
- [ ] Farmer A cannot read Farmer B's fields.
- [ ] Farmer cannot mutate protected ownership/verification attributes.
- [ ] Operator cannot upload evidence for an unrelated job.
- [ ] Operator cannot grant themselves dispatcher/verifier privileges.
- [ ] Buyer cannot read another buyer's private demand.
- [ ] Verifier can perform only verifier-authorized transitions.
- [ ] Admin-only operations remain admin-only.
- [ ] Anonymous users cannot call privileged RPCs.
- [ ] Security-definer RPCs remain safe under hostile client parameters.

Record the project ref, migration status, test account roles, and result date. Never place credentials in this repository.

## P0 — real farmer OTP

Requires the team's own test phone and configured SMS provider.

1. Configure Supabase Auth/SMS provider.
2. Request OTP.
3. Verify OTP.
4. Create/persist farmer profile.
5. Grant consent.
6. Select or create a field.
7. Book a clearance request.
8. Verify the same authenticated identity is retained through the workflow.
9. Test logout/login persistence.
10. Test consent withdrawal and the resulting access boundary.

## P0 — operator device workflow

Use a real Android device:

Login → assigned job → GPS permission → move → GPS updates → capture photo → disable internet → capture photo → close/reopen app → reconnect → queue drains → evidence row appears → verifier can review.

Also deliberately test: GPS denied, stale GPS, extended offline mode, duplicate upload, invalid/oversized photo, app killed while offline, battery saver, and revoked camera/location permission.

## P0/P1 — Telegram

Requires a real bot, webhook URL, secret and test farmer.

- [ ] Create/configure bot.
- [ ] Configure webhook and secret.
- [ ] Link a real farmer account.
- [ ] Verify secure link token expiry.
- [ ] Verify /start.
- [ ] Verify notification delivery.
- [ ] Verify Mini App identity authentication.
- [ ] Replay the same webhook and confirm idempotency.
- [ ] Test an invalid webhook secret.
- [ ] Test an expired/used link token.

## P0/P1 — dispatch

The Python OR-Tools service must be deployed separately and connected with DISPATCH_SERVICE_URL and DISPATCH_SERVICE_TOKEN.

Test: normal dispatch; machine unavailable; machine capacity exhausted; impossible deadline; malformed solver response; solver timeout; service unavailable; fallback heuristic.

A generated route must never silently become a confirmed booking.

## P1 — external evidence

### FIRMS / satellite
- [ ] Configure FIRMS_MAP_KEY.
- [ ] Run scheduled ingestion.
- [ ] Store source, observation time, geometry, freshness and processing version.
- [ ] Test provider failure/retry.
- [ ] Test human verification workflow.

Satellite observations remain supporting evidence. They do not prove field-level absence of burning by themselves.

### Cadastral/Khasra
Keep field provenance explicit: Farmer declared; Manually drawn; Imported; Authoritatively verified.

Do not label a manually drawn boundary as cadastral/authoritative.

## P1 — commercial workflow

Buyer/offtake remains a prototype until real counterparties exist.

Required real workflow: Buyer identity → demand → quality requirement → quantity → price → pickup location → delivery window → acceptance terms → offer → acceptance → custody → delivery.

Seeded/demo buyers must remain clearly labelled.

## Intentionally out of scope

### Payments
No real money movement in the current release. UI may show estimates or future settlement concepts, but no action should imply that a payment occurred.

### Carbon
Carbon certificates and marketplace surfaces remain illustrative until methodology, baseline, additionality, MRV, registry issuance, retirement and double-counting controls exist.

## AI provider validation

When provider credentials are configured:
- [ ] Authenticated request works.
- [ ] Rate limits work.
- [ ] Timeout/failure states work.
- [ ] Malformed provider response is handled.
- [ ] Sensitive farmer information is minimized.
- [ ] Assistant proposes; human approves consequential actions.
- [ ] AI cannot silently book, settle, verify or change protected state.

## Browser E2E

The current release does not include a browser E2E harness.

Minimum future Playwright journeys:
1. Farmer: login → field → booking → tracking → evidence → verification → residue.
2. Operator: login → job → GPS → evidence → offline → reconnect.
3. Buyer: demand → verified residue → pool → offer.

Until automated E2E exists, use the manual checklist above and record the exact commit tested.

## Final release evidence

A release should record: Git commit SHA; CI result; Vercel deployment URL and commit; Supabase migration status; provider configuration status; RLS role-test result; Android device-test result; Telegram test result; dispatch-service test result; known limitations.

**Rule:** a passing build is not proof of provider integration, authorization correctness, device reliability, or field readiness.