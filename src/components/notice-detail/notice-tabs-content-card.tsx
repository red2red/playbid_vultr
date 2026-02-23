'use client';

import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { NoticeDetailSections } from '@/lib/bid/notice-detail-types';

interface NoticeTabsContentCardProps {
    sections: NoticeDetailSections;
}

const TAB_ITEMS = [
    { key: 'overview', label: '사업개요' },
    { key: 'qualification', label: '참가자격' },
    { key: 'documents', label: '제출서류' },
    { key: 'etc', label: '기타사항' },
] as const;

type TabKey = (typeof TAB_ITEMS)[number]['key'];
const TAB_KEYS = TAB_ITEMS.map((tab) => tab.key);

export function NoticeTabsContentCard({ sections }: NoticeTabsContentCardProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const content = useMemo(() => sections[activeTab], [activeTab, sections]);
    const tabPanelId = `notice-detail-tabpanel-${activeTab}`;

    const focusTab = (key: TabKey) => {
        const tabElement = document.getElementById(`notice-detail-tab-${key}`);
        tabElement?.focus();
    };

    const handleTabKeyDown = (
        event: KeyboardEvent<HTMLButtonElement>,
        currentKey: TabKey
    ) => {
        const currentIndex = TAB_KEYS.indexOf(currentKey);
        if (currentIndex < 0) {
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            const nextKey = TAB_KEYS[(currentIndex + 1) % TAB_KEYS.length];
            setActiveTab(nextKey);
            focusTab(nextKey);
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            const nextKey = TAB_KEYS[(currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length];
            setActiveTab(nextKey);
            focusTab(nextKey);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            const firstKey = TAB_KEYS[0];
            setActiveTab(firstKey);
            focusTab(firstKey);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            const lastKey = TAB_KEYS[TAB_KEYS.length - 1];
            setActiveTab(lastKey);
            focusTab(lastKey);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#151E32]">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">상세 내용</h2>

            <div
                role="tablist"
                aria-label="상세 내용 탭"
                className="mb-4 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
            >
                {TAB_ITEMS.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            id={`notice-detail-tab-${tab.key}`}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            aria-controls={`notice-detail-tabpanel-${tab.key}`}
                            tabIndex={active ? 0 : -1}
                            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-800 ${
                                active
                                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                            onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div
                id={tabPanelId}
                role="tabpanel"
                aria-labelledby={`notice-detail-tab-${activeTab}`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 transition-opacity duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
                {content}
            </div>
        </section>
    );
}
