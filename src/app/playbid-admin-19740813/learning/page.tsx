"use client";

import { useState } from "react";

const mockCategories = [
    { id: "1", name: "입찰 기초", icon: "📚", contentCount: 12, order: 1 },
    { id: "2", name: "법규 이해", icon: "⚖️", contentCount: 8, order: 2 },
    { id: "3", name: "입찰 전략", icon: "🎯", contentCount: 15, order: 3 },
    { id: "4", name: "실전 사례", icon: "💼", contentCount: 6, order: 4 },
];

const mockContents = [
    { id: "1", title: "공공입찰이란?", categoryId: "1", type: "article", views: 1234, quizCount: 5, status: "published" },
    { id: "2", title: "나라장터 이용법", categoryId: "1", type: "article", views: 892, quizCount: 3, status: "published" },
    { id: "3", title: "적격심사 완전정복", categoryId: "3", type: "scenario", views: 567, quizCount: 8, status: "published" },
    { id: "4", title: "전자입찰 시스템", categoryId: "1", type: "flashcard", views: 234, quizCount: 10, status: "draft" },
];

export default function LearningPage() {
    const [activeTab, setActiveTab] = useState<"categories" | "contents" | "quizzes">("categories");

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">학습 콘텐츠 관리</h1>
                    <p className="text-slate-600">앱 내 학습 콘텐츠를 관리합니다.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
                <div className="flex gap-4">
                    {[
                        { key: "categories", label: "카테고리" },
                        { key: "contents", label: "콘텐츠" },
                        { key: "quizzes", label: "퀴즈" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {activeTab === "categories" && <CategoriesTab categories={mockCategories} />}
            {activeTab === "contents" && <ContentsTab contents={mockContents} categories={mockCategories} />}
            {activeTab === "quizzes" && <QuizzesTab />}
        </div>
    );
}

function CategoriesTab({ categories }: { categories: typeof mockCategories }) {
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 카테고리 추가
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{cat.icon}</span>
                            <div>
                                <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                                <p className="text-sm text-slate-600">{cat.contentCount}개 콘텐츠</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                            <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContentsTab({ contents, categories }: { contents: typeof mockContents; categories: typeof mockCategories }) {
    const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
    const getTypeLabel = (type: string) => {
        const types: Record<string, { label: string; color: string }> = {
            article: { label: "아티클", color: "bg-blue-100 text-blue-700" },
            scenario: { label: "시나리오", color: "bg-purple-100 text-purple-700" },
            flashcard: { label: "플래시카드", color: "bg-green-100 text-green-700" },
        };
        return types[type] || { label: type, color: "bg-slate-100 text-slate-700" };
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 콘텐츠 추가
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">유형</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">조회수</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">퀴즈</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">상태</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contents.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{item.title}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {getCategory(item.categoryId)?.icon} {getCategory(item.categoryId)?.name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeLabel(item.type).color}`}>
                                        {getTypeLabel(item.type).label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.views.toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{item.quizCount}문제</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {item.status === "published" ? "게시됨" : "임시저장"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                        <button className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function QuizzesTab() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <span className="text-4xl mb-4 block">❓</span>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">퀴즈 관리</h3>
            <p className="text-slate-600 mb-4">퀴즈 문제를 관리하는 기능입니다.</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                + 퀴즈 추가
            </button>
        </div>
    );
}
