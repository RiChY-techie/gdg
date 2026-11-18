# Firestore Security Specification (Phase 0 — Payload-First Security TDD)

## 1. Data Invariants

1. **Identity Integrity:** Every user-authored record (`joinRequests`, `registrations`, `projects`, `inquiries`) MUST carry `uid == request.auth.uid` on creation, and `uid` is immutable on updates.
2. **Verified Users Only:** All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **No Self-Assigned Privileges:** Users cannot create documents in `/admins/{adminUid}` or set `clubRole: 'Club Head'` / `status: 'approved'` unless `isAdmin()` is true.
4. **PII Isolation:** Student emails and USNs in `/members`, `/joinRequests`, `/registrations`, and `/inquiries` are never publicly listable (`allow list` requires `isAdmin() || resource.data.uid == request.auth.uid`). Public displays use `/clubHeads` (no email) and `/meta/clubStats` (aggregate counters only).
5. **Temporal Integrity:** Creation timestamps (`createdAt`) must equal `request.time` and remain immutable after creation.
6. **Path & Payload Bounds:** All document IDs match `^[a-zA-Z0-9_-]{1,128}$` via `isValidId()`, and every string and array enforces explicit `.size()` bounds.

## 2. Dirty Dozen Attack Payloads (Must All Return `PERMISSION_DENIED`)

1. **Unauthenticated Member Creation:** `CREATE /members/m1` with `request.auth == null`.
2. **Self-Admin Escalation:** `CREATE /admins/{uid}` by non-admin user trying to grant themselves Principal/HOD access.
3. **Join Request Self-Approval:** `CREATE /joinRequests/r1` with `status: "approved"` instead of `"pending"`.
4. **Ghost Field Injection on Registration:** `CREATE /registrations/reg1` including shadow field `checkedIn: true` or `isAdmin: true`.
5. **Identity Spoofing on Project:** `CREATE /projects/p1` with `uid: "other_user_uid"`.
6. **Unverified Email Bypass:** Write request from token where `email == "chethanb187@gmail.com"` but `email_verified == false`.
7. **PII List Scraping:** `LIST /members` or `LIST /inquiries` by a regular signed-in non-admin student.
8. **Cross-User Pass Deletion:** `DELETE /registrations/reg_other` where `resource.data.uid != request.auth.uid` and caller is not admin.
9. **Member Role Self-Promotion:** `UPDATE /members/m1` by owner attempting to modify `clubRole` from `"Member"` to `"Club Head"`.
10. **1MB ID Poisoning:** `CREATE /projects/<200_char_id>` violating `isValidId()`.
11. **Timestamp Forgery:** `CREATE /inquiries/i1` with client-backdated `createdAt` not equal to `request.time`.
12. **Terminal State Tampering:** Non-admin `UPDATE /joinRequests/r1` attempting to flip `status` from `"rejected"` back to `"approved"`.
