# Security Specification — London's Outlet

## 1. Data Invariants
1. Public visitors can read `products`, `categories`, `brands`, and `store` documents without authentication.
2. Only the authenticated store administrator (`request.auth != null && request.auth.token.email == "admin@londonsoutlet.app"`) may create, update, or delete documents in `products`, `categories`, `brands`, or `store`.
3. Every document ID must satisfy `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
4. Every string field is strictly type-checked and bounded in `.size()`.
5. Every array field (`sizes`, `colors`, `images`, `heroImages`, `galleryImages`) is strictly bounded in `.size()` and checks element types.
6. No unvalidated shadow keys are permitted (`data.keys().hasAll(...)` and `data.keys().hasOnly(...)` on create; `affectedKeys().hasOnly(...)` on update).
7. Any document outside `/products`, `/categories`, `/brands`, `/store` is denied by the global catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. Adversarial Test Payloads ("Dirty Dozen")
1. Unauthenticated `create` on `/products/p1` -> `PERMISSION_DENIED`
2. Non-admin authenticated user (`user@example.com`) `create` on `/products/p1` -> `PERMISSION_DENIED`
3. Non-admin `update` on `/store/info` -> `PERMISSION_DENIED`
4. Non-admin `delete` on `/categories/jeans` -> `PERMISSION_DENIED`
5. Admin `create` on `/products/p1` with shadow key `isAdmin: true` -> `PERMISSION_DENIED`
6. Admin `create` on `/products/p1` with negative `priceUsd: -10` -> `PERMISSION_DENIED`
7. Admin `create` on `/products/p1` with 2KB string in `nameEn` -> `PERMISSION_DENIED`
8. Admin `create` on `/products/p1` with >20 items in `sizes` array -> `PERMISSION_DENIED`
9. Admin `create` on `/products/invalid$id!` with invalid path ID -> `PERMISSION_DENIED`
10. Admin `update` on `/products/p1` with unknown key `ghostField: 123` -> `PERMISSION_DENIED`
11. Admin `create` on `/brands/b1` missing `name` -> `PERMISSION_DENIED`
12. Any user `read` or `write` on `/secrets/keys` -> `PERMISSION_DENIED`
