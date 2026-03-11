---
children_hash: 7a49196c7aba6f6906bdfac70a495702352701dc53d47daf05819b852a55ac3e
compression_ratio: 0.6666666666666666
condensation_order: 1
covers: [supabase_server_integration.md]
covers_token_total: 186
summary_level: d1
token_count: 124
type: summary
---
### Supabase Server Integration
Centralizes Supabase client instantiation using @supabase/ssr for SSR cookie management.

*   **Files:** `src/lib/supabase/server.ts` (client logic), `src/proxy.ts`.
*   **Workflow:** Implements cookie-based persistence via `next/headers`.
*   **Key Behavior:** Gracefully handles missing environment variables by injecting a placeholder client in non-production environments.
*   **Reference:** See `supabase_server_integration.md` for full implementation details.