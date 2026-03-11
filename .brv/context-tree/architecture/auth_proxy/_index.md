---
children_hash: 06d1d27caeee1890f696bd0f9fa766c980f78be0193c1e7c857517cd868734d9
compression_ratio: 0.8817733990147784
condensation_order: 1
covers: [authentication_proxy.md]
covers_token_total: 203
summary_level: d1
token_count: 179
type: summary
---
# Authentication Proxy (architecture/auth_proxy)

The Authentication Proxy manages protected route access, utilizing `src/proxy.ts` for logic and `src/lib/auth/route-access.ts` for route definitions.

### Workflow
Request → Path Validation → User Context Retrieval → Auth/Admin Verification → Access Grant/Redirect

### Key Capabilities
*   **Access Control:** Manages public, protected, and admin-only routes.
*   **Redirection:** Automatically redirects unauthorized requests to login.
*   **Admin Security:** Restricts administrative routes to authorized email addresses.

### Technical Facts
*   **Proxy Logic:** Centralized in `src/proxy.ts`.
*   **Route Definitions:** Managed in `src/lib/auth/route-access.ts`.