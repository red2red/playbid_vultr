---
title: Supabase Server Integration
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-03-11T01:32:23.838Z'
updatedAt: '2026-03-11T01:32:23.838Z'
---
## Raw Concept
**Task:**
Document Supabase integration

**Files:**
- src/lib/supabase/server.ts
- src/proxy.ts

**Flow:**
Create client -> get/set cookies via SSR

## Narrative
### Structure
Centralized Supabase client creation leveraging next/headers for cookie management.

### Highlights
Handles missing env vars gracefully with a placeholder client for non-production environments.

## Facts
- **database**: Supabase server client is centralized in src/lib/supabase/server.ts [project]
- **authentication**: Uses @supabase/ssr for server-side auth [project]
