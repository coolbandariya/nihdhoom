# NIRDHOOM RLS Role Test Matrix

Use this matrix against a fresh/dedicated Supabase environment with separate test identities. It is a release test plan, not a claim that production authorization has already been validated.

| Role | Must read | Must write | Must never access/change |
|---|---|---|---|
| Farmer | Own profile, own fields, own bookings, own evidence outcomes | Own permitted requests and consent paths | Other farmers' private records; protected verification/ownership fields; admin controls |
| Operator | Assigned jobs and required machine/evidence context | Own assigned job progress and evidence | Unassigned jobs; other operators' private records; role assignments |
| Dispatcher | Operational fields, machine availability and dispatch inputs | Dispatch assignments through approved workflow | Farmer-owned protected attributes; verifier decisions; buyer-private data |
| Verifier | Evidence and field records needed for verification | Verification review through approved RPC/workflow | Booking ownership, role grants, buyer-private records |
| Buyer | Own demand and explicitly matched commercial records | Own demand/offer workflow | Other buyers' private demand; farmer private profile data |
| Admin | Operational administration as explicitly scoped | Admin-only configuration/maintenance | Nothing beyond documented admin scope |

## Abuse cases

- Farmer A attempts to query Farmer B's field by UUID.
- Farmer A attempts to update Farmer B's ownership/verification attributes.
- Operator A attempts to insert evidence against Operator B's job.
- Operator attempts to set their own role to dispatcher/verifier.
- Buyer A attempts to query Buyer B's demand.
- Verifier attempts to alter protected booking/settlement fields.
- Anonymous client attempts privileged RPC execution.
- Authenticated client sends fabricated quote, status, verification, confidence, payout or settlement values.

## Pass criteria

Every unauthorized operation is rejected by the database policy/RPC boundary, not merely hidden by the frontend.

Record test date, Supabase project ref, migration head, role identity, operation, expected result and actual result in the release record.