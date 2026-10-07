# NIRDHOOM Controlled Pilot Runbook

This runbook is the operational sign-off layer for the repository's release gates. It does not claim a provider, device, cadastral source, or field pilot is complete until the named evidence is attached.

## 1. Release candidate

Record:

- Commit SHA:
- CI run:
- Supabase project:
- Vercel deployment:
- Dispatch service deployment:
- Pilot geography:
- Pilot operator:
- Support owner:

Before proceeding, run:

```bash
npm ci --no-audit --no-fund
npm run syntaxcheck
npm run audit
npm test
npm run build
python -m pip install -r services/dispatch-ortools/requirements.txt
python -m compileall -q services/dispatch-ortools
cd services/dispatch-ortools && python -m unittest test_main.py -v
```

## 2. Identity and consent

Use separate real test accounts for farmer, operator, dispatcher, verifier, buyer and admin.

Verify:

- phone OTP delivery and expiry;
- farmer profile creation;
- operational consent creates a timestamped versioned record;
- consent withdrawal sets the consent record's `revoked_at` and profile state to `REVOKED`;
- a withdrawn farmer cannot create a new booking until consent is granted again;
- self-service profile edits cannot change role.

Evidence: test-account IDs, timestamps, expected/actual result, no OTP values or secrets.

## 3. Field and cadastral truth

Verify:

- manually drawn/farmer-declared geometry is visibly labelled as such;
- authoritative cadastral/Khasra geometry comes only from an approved import/source;
- geometry is server-validated for coordinate range, validity and service region;
- source, capture time and verification state are retained;
- unavailable cadastral services never become a verified UI state.

Do not use a public cadastral viewer as an authoritative API.

## 4. Operator device test

On a real Android device:

1. Sign in as the assigned operator.
2. Confirm only the assigned job/field is actionable.
3. Enable GPS and confirm timestamp + accuracy are displayed.
4. Leave the device without a fresh GPS fix for >60 seconds and confirm the UI says the reading is stale.
5. Disable connectivity.
6. Capture an evidence photo.
7. Confirm it enters the offline queue.
8. Reconnect.
9. Confirm exactly one evidence asset is created.
10. Repeat with an interrupted upload and an app restart.
11. Confirm evidence remains private and linked to the correct field/job.

Record Android model, OS version, browser/PWA version and test times.

## 5. Dispatch

Test:

- normal optimizer response;
- service timeout;
- malformed optimizer payload;
- unavailable optimizer;
- stale/offline machine;
- capacity overflow;
- impossible deadline;
- partially unassigned work.

A heuristic fallback must be labelled an **estimate**, never a confirmed route. Preserve unassigned reasons and manual reassignment history.

## 6. Verification and remote sensing

Confirm that:

- operational evidence;
- remote-sensing observations; and
- human verification decisions

remain separate records.

A FIRMS/VIIRS observation is supporting screening only. Absence of a detection is not proof of no burning.

Verify verifier identity, decision, reason and override/dispute history.

## 7. Residue and buyer workflow

Test:

- only verified residue can enter a production pool;
- concurrent acceptance cannot oversell a lot;
- quantity, moisture, quality, custody and status changes are auditable;
- buyer identity and offer authority are verified before production acceptance;
- demo/seeded buyers and prices are labelled as demo data.

## 8. Failure and privacy checks

Exercise API timeout, provider failure and malformed payload paths.

Confirm:

- no tokens in logs;
- no raw phone numbers in logs;
- no private evidence bytes in public responses;
- authenticated/API responses are not cached indiscriminately;
- rate limits return safe errors;
- reduced-motion and keyboard navigation remain usable.

## 9. Incident response

Document before pilot:

- support contact;
- incident severity levels;
- backup/restore owner;
- rollback procedure;
- data retention/deletion process;
- provider outage procedure;
- field safety escalation;
- evidence dispute procedure.

## 10. Go / no-go

**Go only when every production gate has attached evidence.**

A successful build, static audit, or demo is not sufficient evidence of RLS correctness, provider configuration, GPS reliability, cadastral truth, buyer authority, or field-pilot readiness.
