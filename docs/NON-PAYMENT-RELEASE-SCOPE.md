# NIRDHOOM V7 — Non-payment completion scope

This scope explicitly excludes integrating a real payment or payout provider. The payment UI and ledger are demonstration-only; they must not be represented as money movement or settlement. Work on the rest of the field-to-residue workflow remains in scope.

## Delivery boundary

- Keep payment initiation fail-closed and clearly labelled as a demo.
- Do not add provider credentials, payment SDKs, live payout calls, settlement claims, or payment webhooks that imply real money movement.
- Payment-related screens may explain the intended future flow, but must not mark a booking paid based on a UI action or demo event.

## Non-payment release gates

### Identity, consent, and access
- [ ] Verify phone OTP in the deployed Supabase project.
- [x] Persist explicit farmer consent with timestamp, policy/version, and self-service withdrawal path. [Repository implementation; deployed-provider verification remains required.]
- [ ] Confirm self-service profile changes cannot grant privileged roles.
- [ ] Exercise RLS with separate farmer, operator, dispatcher, verifier, buyer, and admin accounts.
- [ ] Verify users cannot access another farmer's fields, bookings, evidence, or conversations.

### Field records and geometry
- [ ] Connect only to a dedicated, configured Supabase project before pilot data is entered.
- [ ] Distinguish farmer-entered boundaries from authoritative cadastral/Khasra geometry.
- [ ] Validate geometry server-side (coordinate range, polygon closure/validity, area, and service region).
- [ ] Record source, capture time, and verification state for every geometry.
- [ ] Do not label demo or manually drawn boundaries as cadastral truth.

### Operator, GPS, and evidence
- [ ] Verify operator identity and assignment before accepting operational updates.
- [x] Record GPS timestamp, accuracy, and source; display stale/offline readings as such. [Repository implementation; real-device validation remains required.]
- [ ] Validate evidence file size, MIME type, and actual content; use private storage.
- [ ] Compute integrity hashes from trusted uploaded bytes, not a client-provided digest.
- [ ] Enforce field/booking assignment authorization for evidence writes.
- [ ] Test offline capture, retry, duplicate submission, and recovery on a real Android device.

### Dispatch and operations
- [ ] Validate optimizer assignments against current fields, machine status, capacity, and deadlines.
- [ ] Label heuristic fallback as an estimate, never as a confirmed route.
- [ ] Explain unassigned work and preserve manual reassignment history.
- [ ] Test breakdown, stale GPS, capacity overflow, and partial optimizer failure.

### Verification and provenance
- [ ] Keep satellite detections, field/operator evidence, and human decisions as separate records.
- [ ] Record verifier identity, decision, reason, and override history.
- [ ] Provide a human review and dispute path.
- [ ] Treat FIRMS/VIIRS as supporting screening only; no detection is not proof of no burning.
- [ ] Label carbon estimates as estimates and do not imply registry-issued credits without a real methodology and registry record.

### Buyer and residue workflow
- [ ] Verify buyer identity and offer authority before accepting an offer.
- [ ] Prevent over-selling a residue lot under concurrent acceptance.
- [ ] Track lot quantity, moisture, custody, and status changes with an audit trail.
- [ ] Label seeded buyers, prices, and contracts as demo data.

### Reliability, accessibility, and release
- [ ] Run clean npm install/CI, syntax/type checks, static audit, unit tests, production build and dispatch-service tests on the release commit.
- [ ] Browser E2E testing is intentionally not part of the current release.
- [ ] Test API timeouts, provider failures, malformed payloads, and safe error responses.
- [ ] Verify service-worker updates and ensure authenticated/API responses are not cached.
- [ ] Test keyboard navigation, screen-reader labels, contrast, reduced motion, and low-end Android layouts.
- [ ] Confirm logs omit tokens, phone numbers, and sensitive evidence.
- [ ] Complete a pilot runbook covering support, incident response, backup/restore, rollback, and data retention.

## Release status

This file is a checklist, not evidence that a gate has passed. Mark a gate complete only after attaching the relevant test result, environment verification, or operational sign-off. No live payment integration is part of this scope.
