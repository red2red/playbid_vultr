'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { trackUiEvent } from '@/lib/analytics/client';
import { createClient } from '@/lib/supabase/client';

interface DashboardNavChildItem {
    href: string;
    label: string;
}

interface DashboardNavItem {
    href: string;
    label: string;
    icon: string;
    children?: readonly DashboardNavChildItem[];
}

export const DASHBOARD_NAV_ITEMS = [
    { href: '/dashboard', label: '대시보드', icon: '📊' },
    { href: '/bid_notice', label: '입찰공고', icon: '📋' },
    { href: '/bid_opening', label: '개찰결과', icon: '✅' },
    { href: '/bid_history', label: '입찰이력', icon: '🕘' },
    { href: '/learning', label: '학습센터', icon: '📚' },
    {
        href: '/challenge',
        label: '챌린지',
        icon: '🏆',
        children: [
            { href: '/challenge', label: '레벨카드' },
            { href: '/challenge/missions', label: '오늘의 미션' },
            { href: '/challenge/ranking', label: '랭킹' },
            { href: '/challenge/badges', label: '배지' },
            { href: '/challenge/xp-guide', label: 'XP 가이드' },
        ],
    },
    { href: '/profile/edit', label: '설정', icon: '⚙️' },
] as const satisfies readonly DashboardNavItem[];

interface DashboardSidebarNavProps {
    pathname?: string;
    onNavItemClick?: () => void;
    userDisplayName?: string;
    userLevelLabel?: string | null;
}

function normalizePathname(pathname: string): string {
    if (!pathname) return '/dashboard';
    if (pathname !== '/' && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }
    return pathname;
}

function isPathMatch(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveActiveDashboardChildHref(pathname: string, item: DashboardNavItem): string | null {
    if (!item.children || item.children.length === 0) {
        return null;
    }

    const normalizedPathname = normalizePathname(pathname);
    const matchedChild = item.children.find((child) => {
        // Parent shortcut child (e.g. /challenge) should not absorb deeper pages.
        if (child.href === item.href) {
            return normalizedPathname === child.href;
        }
        return isPathMatch(normalizedPathname, child.href);
    });

    return matchedChild?.href ?? null;
}

export function resolveActiveDashboardHref(pathname: string): string | null {
    const normalizedPathname = normalizePathname(pathname);

    if (normalizedPathname.startsWith('/profile')) {
        return '/profile/edit';
    }
    if (normalizedPathname.startsWith('/bid_history/analysis')) {
        return '/bid_history';
    }
    if (normalizedPathname === '/bid_history') {
        return '/bid_history';
    }
    if (normalizedPathname.startsWith('/qualification-calculator')) {
        return '/bid_notice';
    }

    const matchedItem = DASHBOARD_NAV_ITEMS.find(
        (item) => isPathMatch(normalizedPathname, item.href)
    );

    return matchedItem?.href ?? null;
}

export function DashboardSidebarNav({
    pathname = '/dashboard',
    userDisplayName = '사용자',
    userLevelLabel = null,
}: DashboardSidebarNavProps) {
    const activeHref = resolveActiveDashboardHref(pathname);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const initial = userDisplayName.slice(0, 1) || '사';

    const handleLogout = async () => {
        if (isSigningOut) {
            return;
        }

        setIsSigningOut(true);
        trackUiEvent('dashboard_sidebar_logout_click', { pathname });

        try {
            await supabase.auth.signOut();
        } finally {
            router.push('/login');
            router.refresh();
        }
    };

    return (
        <aside className="hidden h-screen w-[240px] shrink-0 border-r border-[var(--dashboard-border)] bg-[var(--dashboard-bg-sidebar)] lg:fixed lg:flex lg:flex-col">
            <div className="px-5 py-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <Image src="/logo-dark.png" alt="PlayBid 로고" width={28} height={28} className="object-contain" />
                    <span className="text-lg font-extrabold tracking-tight text-white">PlayBid</span>
                </Link>
            </div>

            <div className="mb-6 px-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                        {initial}
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="truncate text-sm font-semibold text-white">{userDisplayName}</span>
                        <span className="text-xs font-medium text-slate-400">{userLevelLabel ?? '레벨 정보 없음'}</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="대시보드 사이드바 메뉴">
                {DASHBOARD_NAV_ITEMS.map((item) => {
                    const isActive = item.href === activeHref;
                    const activeChildHref = resolveActiveDashboardChildHref(pathname, item);

                    return (
                        <div key={item.href} className="space-y-1">
                            <Link
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() =>
                                    trackUiEvent('dashboard_sidebar_nav_click', {
                                        targetHref: item.href,
                                        label: item.label,
                                    })
                                }
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${isActive
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span aria-hidden="true">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>

                            {'children' in item && item.children && item.children.length > 0 ? (
                                <div className="ml-6 space-y-1 border-l border-white/10 pl-3">
                                    {item.children.map((child) => {
                                        const isChildActive = child.href === activeChildHref;

                                        return (
                                            <Link
                                                key={`${item.href}:${child.label}`}
                                                href={child.href}
                                                aria-current={isChildActive ? 'page' : undefined}
                                                onClick={() =>
                                                    trackUiEvent('dashboard_sidebar_nav_click', {
                                                        targetHref: child.href,
                                                        label: `${item.label}_${child.label}`,
                                                        source: 'desktop-submenu',
                                                    })
                                                }
                                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${isChildActive
                                                    ? 'bg-blue-500/15 text-blue-200'
                                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                                    }`}
                                            >
                                                <span aria-hidden="true" className="text-[10px] leading-none">
                                                    •
                                                </span>
                                                <span>{child.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </nav>

            <div className="mt-auto p-4 pt-0 space-y-3">
                <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-800 p-4 text-white">
                    <p className="text-[11px] font-semibold text-slate-200">프리미엄 혜택</p>
                    <p className="mt-1 text-sm font-bold">Pro 업그레이드</p>
                    <button
                        type="button"
                        className="mt-3 h-8 w-full rounded-md border border-white/20 bg-white/10 text-xs font-semibold hover:bg-white/20"
                    >
                        지금 시작하기
                    </button>
                </div>

                <button
                    type="button"
                    aria-label="로그아웃"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <span aria-hidden="true">🚪</span>
                    <span>{isSigningOut ? '로그아웃 중...' : '로그아웃'}</span>
                </button>
            </div>
        </aside>
    );
}
