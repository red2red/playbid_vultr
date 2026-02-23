#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_PROVIDERS = ['apple', 'google', 'kakao', 'naver'];
const DEFAULT_DEFERRED_PROVIDERS = ['apple'];
const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

function parseCliArgs(argv) {
    const args = {
        writePath: null,
        deferredProviders: [],
    };
    for (let i = 2; i < argv.length; i += 1) {
        const current = argv[i];
        if (current === '--write' && argv[i + 1]) {
            args.writePath = argv[i + 1];
            i += 1;
            continue;
        }
        if (current === '--defer' && argv[i + 1]) {
            args.deferredProviders.push(...parseProviderList(argv[i + 1]));
            i += 1;
        }
    }
    return args;
}

function parseProviderList(rawValue) {
    if (!rawValue) {
        return [];
    }

    return rawValue
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function normalizeProviders(values) {
    const normalized = [];
    for (const value of values) {
        if (!REQUIRED_PROVIDERS.includes(value)) {
            continue;
        }
        if (!normalized.includes(value)) {
            normalized.push(value);
        }
    }
    return normalized;
}

async function loadEnvFileIfExists(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const lines = raw.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex <= 0) {
                continue;
            }
            const key = trimmed.slice(0, equalIndex).trim();
            let value = trimmed.slice(equalIndex + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (!(key in process.env)) {
                process.env[key] = value;
            }
        }
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return;
        }
        throw error;
    }
}

function maskSupabaseHost(urlString) {
    try {
        const url = new URL(urlString);
        return url.host;
    } catch {
        return 'invalid-url';
    }
}

function resolveAuthCallbackUrl({
    explicitCallbackUrl,
    supabaseUrl,
}) {
    if (explicitCallbackUrl) {
        try {
            const parsed = new URL(explicitCallbackUrl);
            return parsed.toString();
        } catch {
            throw new Error(`invalid SUPABASE_AUTH_CALLBACK_URL: ${explicitCallbackUrl}`);
        }
    }

    return `${supabaseUrl}/auth/v1/callback`;
}

async function fetchAuthSettings(supabaseUrl, anonKey) {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
            apikey: anonKey,
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`settings fetch failed: ${response.status} ${body.slice(0, 200)}`);
    }

    return response.json();
}

async function probeAuthorizeEndpoint({ supabaseUrl, anonKey, provider, redirectTo }) {
    const url = new URL(`${supabaseUrl}/auth/v1/authorize`);
    url.searchParams.set('provider', provider);
    url.searchParams.set('redirect_to', redirectTo);

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            apikey: anonKey,
            Accept: 'application/json',
        },
        redirect: 'manual',
    });

    const status = response.status;
    const ok = status >= 300 && status < 400;
    let detail = '';

    if (!ok) {
        const text = await response.text();
        detail = text.slice(0, 200);
    }

    return {
        ok,
        status,
        detail,
    };
}

function toMarkdownTable(rows) {
    const lines = [
        '| Provider | Scope | Enabled In Supabase | localhost authorize | site authorize | Notes |',
        '|---|---|---|---|---|---|',
    ];
    for (const row of rows) {
        lines.push(
            `| ${row.provider} | ${row.deferred ? 'Deferred' : 'Required'} | ${row.enabled ? 'YES' : 'NO'} | ${row.localhost.status} (${row.localhost.ok ? 'OK' : 'FAIL'}) | ${row.site ? `${row.site.status} (${row.site.ok ? 'OK' : 'FAIL'})` : 'N/A'} | ${row.note} |`
        );
    }
    return lines.join('\n');
}

async function run() {
    const args = parseCliArgs(process.argv);
    const cwd = process.cwd();
    await loadEnvFileIfExists(path.join(cwd, '.env.local'));

    const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
    if (missingEnvVars.length > 0) {
        console.error(`[oauth-readiness] missing env vars: ${missingEnvVars.join(', ')}`);
        process.exitCode = 1;
        return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const deferredProviders = normalizeProviders([
        ...DEFAULT_DEFERRED_PROVIDERS,
        ...parseProviderList(process.env.OAUTH_DEFERRED_PROVIDERS || ''),
        ...args.deferredProviders,
    ]);
    const authCallbackUrl = resolveAuthCallbackUrl({
        explicitCallbackUrl: process.env.SUPABASE_AUTH_CALLBACK_URL,
        supabaseUrl,
    });
    const checkedAt = new Date().toISOString();
    const redirectPath = '/auth-callback?returnTo=%2Fdashboard';
    const localhostOrigin = 'http://localhost:3000';

    const settings = await fetchAuthSettings(supabaseUrl, anonKey);
    const externalProviders = settings.external ?? {};

    const providerRows = [];
    for (const provider of REQUIRED_PROVIDERS) {
        const deferred = deferredProviders.includes(provider);
        const enabled = externalProviders[provider] === true;
        const localhostProbe = await probeAuthorizeEndpoint({
            supabaseUrl,
            anonKey,
            provider,
            redirectTo: `${localhostOrigin}${redirectPath}&provider=${provider}`,
        });

        const siteProbe = siteUrl
            ? await probeAuthorizeEndpoint({
                  supabaseUrl,
                  anonKey,
                  provider,
                  redirectTo: `${siteUrl.replace(/\/$/, '')}${redirectPath}&provider=${provider}`,
              })
            : null;

        let note = '';
        if (deferred) {
            note = 'Deferred by team decision';
        } else if (!enabled) {
            note = 'Provider disabled in Supabase Auth settings';
        } else if (!localhostProbe.ok) {
            note = localhostProbe.detail.replace(/\|/g, '\\|');
        } else if (siteProbe && !siteProbe.ok) {
            note = siteProbe.detail.replace(/\|/g, '\\|');
        } else {
            note = 'Ready';
        }

        providerRows.push({
            provider,
            deferred,
            enabled,
            localhost: localhostProbe,
            site: siteProbe,
            note,
        });
    }

    const requiredRows = providerRows.filter((row) => !row.deferred);
    const requiredCount = requiredRows.length;
    const enabledCount = requiredRows.filter((row) => row.enabled).length;
    const readyCount = requiredRows.filter(
        (row) => row.enabled && row.localhost.ok && (!row.site || row.site.ok)
    ).length;

    const summaryLines = [
        `# OAuth Provider Readiness (${checkedAt.slice(0, 10)})`,
        '',
        `- Checked at: ${checkedAt}`,
        `- Supabase host: ${maskSupabaseHost(supabaseUrl)}`,
        `- Site URL env: ${siteUrl || '(not configured)'}`,
        `- Provider callback URL: ${authCallbackUrl}`,
        `- Deferred providers: ${deferredProviders.length > 0 ? deferredProviders.join(', ') : '(none)'}`,
        `- Enabled required providers: ${enabledCount}/${requiredCount}`,
        `- Authorize-ready required providers: ${readyCount}/${requiredCount}`,
        '',
        '## Provider Matrix',
        '',
        toMarkdownTable(providerRows),
        '',
        '## Next Actions',
        '1. Keep deferred providers out of release scope and track them in PRD.',
        '2. Enable disabled required providers in Supabase Dashboard > Authentication > Providers.',
        '3. Register callback URL in each provider console:',
        `   - ${authCallbackUrl}`,
        `4. Add allowed app redirect URLs in Supabase URL configuration:`,
        `   - ${localhostOrigin}/auth-callback`,
        siteUrl ? `   - ${siteUrl.replace(/\/$/, '')}/auth-callback` : '   - (production site URL not configured)',
    ];

    const report = `${summaryLines.join('\n')}\n`;
    console.log(report);

    if (args.writePath) {
        const targetPath = path.resolve(cwd, args.writePath);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, report, 'utf8');
        console.log(`[oauth-readiness] report written: ${targetPath}`);
    }

    if (readyCount < requiredCount) {
        process.exitCode = 1;
    }
}

run().catch((error) => {
    console.error('[oauth-readiness] failed:', error);
    process.exitCode = 1;
});
