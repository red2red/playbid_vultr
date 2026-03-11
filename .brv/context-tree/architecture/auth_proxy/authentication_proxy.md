---
title: Authentication Proxy
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:32:23.839Z'
updatedAt: '2026-03-11T01:32:23.839Z'
---
## Raw Concept
**Task:**
Document authentication proxy

**Files:**
- src/proxy.ts
- src/lib/auth/route-access.ts

**Flow:**
request -> check path -> get user -> check auth/admin -> proceed

## Narrative
### Structure
Proxy logic in src/proxy.ts handles protected API and page routes. Uses route definitions from src/lib/auth/route-access.ts.

### Highlights
Supports public vs protected paths, admin-only access, and automatic redirection to login.

## Facts
- **authentication**: Auth/session routing is handled in proxy.ts [project]
- **admin_access**: Admin routes are protected and restricted to specific email addresses [project]
