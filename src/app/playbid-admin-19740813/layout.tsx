"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

const ADMIN_PATH = "/playbid-admin-19740813";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`${ADMIN_PATH}/login`);
        router.refresh();
    };

    const navItems = [
        { href: ADMIN_PATH, icon: "📊", label: "대시보드" },
        { href: `${ADMIN_PATH}/users`, icon: "👥", label: "사용자 관리" },
        { href: `${ADMIN_PATH}/bids`, icon: "📋", label: "입찰 공고" },
        { href: `${ADMIN_PATH}/challenges`, icon: "🏆", label: "챌린지/미션" },
        { href: `${ADMIN_PATH}/learning`, icon: "📚", label: "학습 콘텐츠" },
        { href: `${ADMIN_PATH}/announcements`, icon: "📢", label: "공지사항" },
        { href: `${ADMIN_PATH}/notifications`, icon: "🔔", label: "푸시 알림" },
        { href: `${ADMIN_PATH}/subscriptions`, icon: "💳", label: "구독 관리" },
        { href: `${ADMIN_PATH}/support`, icon: "💬", label: "고객 지원" },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <Link href={ADMIN_PATH} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">P</span>
                        </div>
                        <span className="text-lg font-bold">PlayBid Admin</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            isActive={pathname === item.href}
                        />
                    ))}

                    <div className="pt-4 mt-4 border-t border-slate-700">
                        <NavItem
                            href={`${ADMIN_PATH}/settings`}
                            icon="⚙️"
                            label="설정"
                            isActive={pathname === `${ADMIN_PATH}/settings`}
                        />
                    </div>
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-slate-800">
                    {user && (
                        <div className="mb-3 px-3 py-2 bg-slate-800 rounded-lg">
                            <p className="text-sm font-medium text-white truncate">{user.email}</p>
                            <p className="text-xs text-slate-400">관리자</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition"
                    >
                        <span className="text-lg">🚪</span>
                        <span className="text-sm font-medium">로그아웃</span>
                    </button>
                    <Link
                        href="/"
                        className="mt-2 block text-sm text-slate-400 hover:text-white transition px-3 py-2"
                    >
                        ← 홈페이지로
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function NavItem({
    href,
    icon,
    label,
    isActive
}: {
    href: string;
    icon: string;
    label: string;
    isActive?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
