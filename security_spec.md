# Security Specification for TourOps 360 Workspace

## 1. Data Invariants
1. Unauthenticated users cannot read or write any workspace data (default deny).
2. Users without verified email (`request.auth.token.email_verified == true`) cannot write to workspace data.
3. Only approved team members (or the bootstrapped administrator `josh@pizazzisrael.com`) can read or write shared workflow items (itineraries, tasks, clients, suppliers, invoices, expenses, etc.).
4. Non-approved users may only create/read their own pending request in `approved_members/{uid}` with `status == 'pending'` and cannot self-assign role `admin` or status `approved`.
5. Only administrators can approve team members (`status == 'approved'`) or assign administrative roles.
6. Only administrators can delete staff members or modify administrative permission documents.
7. Any created or updated workflow entity must include valid identification, adhere to field constraints, and record editor attribution (`lastEditedBy`, `lastEditedAt`).
8. Document IDs must conform to the safe identifier pattern `^[a-zA-Z0-9_\-]+$` and not exceed length limits to prevent ID poisoning attacks.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Unauthenticated Read Attack**: Anonymous user attempts to read `/clients/client-1`. Expected: `PERMISSION_DENIED`.
2. **Unverified Email Write**: User with `email_verified: false` attempts to create an itinerary in `/itineraries/voy-1`. Expected: `PERMISSION_DENIED`.
3. **Unapproved User Workspace Read**: Authenticated user with no approved record attempts to list `/itineraries`. Expected: `PERMISSION_DENIED`.
4. **Self-Approval Privilege Escalation**: Non-admin user writes to `/approved_members/{uid}` with `status: "approved"`, `role: "admin"`. Expected: `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: User attempts write to `/itineraries/` with an invalid 2KB junk document ID `$$$%%junk...`. Expected: `PERMISSION_DENIED`.
6. **Admin Record Tampering**: Non-admin user attempts write to `/admins/{uid}`. Expected: `PERMISSION_DENIED`.
7. **Identity Spoofing in Request**: User `uid_abc` attempts to set `uid: "uid_xyz"` on an approved member record. Expected: `PERMISSION_DENIED`.
8. **Shadow Field Injection**: User attempts to inject an unauthorized system field `isSystemSuperuser: true` into a client document. Expected: `PERMISSION_DENIED`.
9. **Value Poisoning**: User sets `totalClientPrice` to a negative string or huge junk payload in an itinerary update. Expected: `PERMISSION_DENIED`.
10. **State Shortcutting in Task**: Unassigned, unapproved visitor attempts to mark tasks as completed. Expected: `PERMISSION_DENIED`.
11. **Direct Workspace Wipeout**: Non-admin user attempts blanket deletion of root workspace settings. Expected: `PERMISSION_DENIED`.
12. **PII Blanket Harvest**: Unauthenticated scraper queries `/clients` or `/staff`. Expected: `PERMISSION_DENIED`.

## 3. Test Runner Specification
See `firestore.rules.test.ts` for automated security rule assertions verifying all Dirty Dozen payloads fail with `PERMISSION_DENIED`.
