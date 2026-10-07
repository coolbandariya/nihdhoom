# NIRDHOOM Release Gate

V7.4 is a repository-hardening release. It does not claim that external production services are connected merely because adapters exist.

## Completed in this release

- The shipped browser entrypoint is the modular src/App.tsx application.
- The obsolete monolithic src/main.jsx implementation was removed from runtime.
- The duplicate src/main.tsx entrypoint was removed.
- The committed nirdhoom-app.html bundle and nirdhoom-final.zip archive were removed.
- V7.1 server-owned booking pricing is present.
- The legacy browser-controlled booking RPC is revoked for authenticated clients.
- Verification requires a completed operational job, evidence, and residue lot.
- Buyer offer acceptance is tenant-scoped and atomically claims a residue lot.
- Provider references have an idempotency uniqueness boundary.
- Self-created accounts cannot assign themselves privileged roles.
- FIRMS observations are no longer browser-insertable.
- Operator evidence writes are linked to the authenticated operator's job.
- GPS and evidence coordinates are constrained server-side.
- Telegram outbound notifications and IVR routes require dispatcher/admin authentication.
- Real payment movement remains explicitly disabled until a real provider adapter and reconciliation contract are implemented.

## Completed repository hardening in the latest pass

- Self-service farmer operational-consent withdrawal is now represented by a server-authorized database boundary and UI control.
- Operator GPS telemetry now records the device timestamp and surfaces readings older than 60 seconds as stale.
- The migration ledger now includes Telegram, integrity-hardening, quantity-invariant and consent-withdrawal migrations.
- A controlled pilot runbook is included at `docs/CONTROLLED-PILOT-RUNBOOK.md`.

## Required before a real pilot

1. Apply all Supabase migrations in order against the dedicated production project.
2. Configure Storage bucket policies and test them with farmer/operator/verifier accounts.
3. Execute authenticated booking, dispatch, evidence, verification, buyer allocation and webhook tests against real Supabase data.
4. Connect real cadastral/Khasra and field-boundary verification.
5. Connect real operator GPS telemetry.
6. Connect the production OR-Tools service with its shared secret.
7. Configure Telegram webhook/linking plus any chosen IVR provider and test consent/rate limits.
8. Calibrate harvest/weather intelligence against real field observations.
9. Complete privacy, consent, retention and incident-response review.
10. Run CI, then conduct a supervised end-to-end field pilot.

## Payment scope

No live payment integration is part of this release. The payment API remains fail-closed and must not present a demo or browser action as settlement.

## Truth labels

The UI and APIs must distinguish:

- demo/mock data;
- farmer-declared data;
- machine telemetry;
- server-authoritative booking data;
- uploaded operational evidence;
- remote-sensing observations;
- human verification decisions;
- provider-settled payment records.

A missing remote-sensing observation is not proof that a field was clear, and a UI state is not proof of a provider settlement.
