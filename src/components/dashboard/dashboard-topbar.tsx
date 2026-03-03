'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { trackUiEvent } from '@/lib/analytics/client';
import { DASHBOARD_NAV_ITEMS, resolveActiveDashboardHref } from './dashboard-sidebar-nav';
import { Icon } from '@iconify/react';

interface DashboardTopbarProps {
    userDisplayName?: string;
    pathname?: string;
}

type DashboardNavItem = {
    href: string;
    label: string;
    icon?: string | React.ReactNode;
    children?: readonly { href: string; label: string }[];
};

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
    if (!('children' in item) || !item.children || item.children.length === 0) {
        return null;
    }

    const normalizedPathname = normalizePathname(pathname);
    const matchedChild = item.children.find((child: any) => {
        if (child.href === item.href) {
            return normalizedPathname === child.href;
        }
        return isPathMatch(normalizedPathname, child.href);
    });

    return matchedChild?.href ?? null;
}

export function DashboardTopbar({
    userDisplayName = '사용자',
    pathname = '/dashboard',
}: DashboardTopbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const activeHref = resolveActiveDashboardHref(pathname);

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg-main)] px-4 md:px-6 lg:px-8">
            <div className="flex w-full items-center gap-3">
                <Link href="/" className="mr-4 flex items-center gap-2 lg:hidden">
                    <Image src="/logo.png" alt="PlayBid 로고" width={24} height={24} className="object-contain dark:hidden" />
                    <Image src="/logo-dark.png" alt="PlayBid 로고" width={24} height={24} className="object-contain hidden dark:block" />
                    <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">PlayBid</span>
                </Link>
                <div className="relative lg:hidden">
                    <button
                        type="button"
                        aria-label="메뉴 열기"
                        aria-expanded={isMenuOpen}
                        aria-controls="dashboard-mobile-menu"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        className="inline-flex h-9 items-center rounded-md border border-[var(--dashboard-border)] bg-[var(--dashboard-bg-content)] px-3 text-sm font-semibold text-slate-200"
                    >
                        메뉴 열기
                    </button>
                    <nav
                        id="dashboard-mobile-menu"
                        className="absolute left-0 top-11 z-50 w-52 rounded-lg border border-[var(--dashboard-border)] bg-[var(--dashboard-bg-content)] p-2 shadow-xl"
                        aria-label="모바일 대시보드 메뉴"
                        hidden={!isMenuOpen}
                    >
                        {DASHBOARD_NAV_ITEMS.map((item) => {
                            const activeChildHref = resolveActiveDashboardChildHref(pathname, item);

                            return (
                                <div key={item.href} className="space-y-1">
                                    <Link
                                        href={item.href}
                                        aria-current={activeHref === item.href ? 'page' : undefined}
                                        onClick={() => {
                                            trackUiEvent('dashboard_sidebar_nav_click', {
                                                targetHref: item.href,
                                                label: item.label,
                                                source: 'mobile',
                                            });
                                            setIsMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${activeHref === item.href
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : 'text-slate-200 hover:bg-white/5'
                                            }`}
                                    >
                                        <span aria-hidden="true">{item.icon as any}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                    {'children' in item && item.children && item.children.length > 0 ? (
                                        <div className="ml-6 space-y-1 border-l border-white/10 pl-3">
                                            {item.children.map((child: any) => {
                                                const isChildActive = child.href === activeChildHref;

                                                return (
                                                    <Link
                                                        key={`${item.href}:${child.label}:mobile`}
                                                        href={child.href}
                                                        aria-current={isChildActive ? 'page' : undefined}
                                                        onClick={() => {
                                                            trackUiEvent('dashboard_sidebar_nav_click', {
                                                                targetHref: child.href,
                                                                label: `${item.label}_${child.label}`,
                                                                source: 'mobile-submenu',
                                                            });
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${isChildActive
                                                            ? 'bg-blue-500/15 text-blue-200'
                                                            : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
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

                        <div className="mt-2 border-t border-slate-700/50 pt-2">
                            <div className="rounded-xl border border-blue-400/20 bg-gradient-to-br from-indigo-700 via-violet-700 to-indigo-800 p-4 text-white">
                                <p className="text-[11px] font-semibold text-slate-200">프리미엄 혜택</p>
                                <p className="mt-1 text-sm font-bold">Pro 업그레이드</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // trackUiEvent('mobile_pro_upgrade_click', { source: 'mobile_menu' });
                                        setIsMenuOpen(false);
                                    }}
                                    className="mt-3 h-8 w-full rounded-md border border-white/20 bg-white/10 text-xs font-semibold transition hover:bg-white/20"
                                >
                                    지금 시작하기
                                </button>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>

            <div className="ml-4 flex items-center gap-4">
                <Link href="/profile/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/5 hover:text-white" aria-label="알림 보기">
                    <Icon icon="solar:bell-linear" className="h-[22px] w-[22px]" />
                    <span className="absolute right-2 top-2 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-[var(--dashboard-bg-topbar)]">
                        3
                    </span>
                </Link>
            </div>
        </header>
    );
}
