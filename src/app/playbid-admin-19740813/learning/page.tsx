"use client";

import { useState, useEffect } from "react";
import {
    getLearningCategories,
    getLearningContents,
    getLearningQuizzes,
    createLearningCategory,
    updateLearningCategory,
    deleteLearningCategory,
    createLearningContent,
    updateLearningContent,
    deleteLearningContent,
    createLearningQuiz,
    updateLearningQuiz,
    deleteLearningQuiz
} from "@/lib/database";

type Category = {
    id: string;
    name: string;
    icon: string;
    display_order: number;
    learning_contents?: { count: number }[];
};

type LearningContent = {
    id: string;
    category_id: string;
    title: string;
    description: string;
    type: string;
    example?: string;
    difficulty: string;
    tags: string[];
    created_at: string;
    learning_categories?: { name: string };
};

type Quiz = {
    id: string;
    category_id: string;
    question: string;
    question_type: string;
    options: any;
    correct_answer: string;
    explanation?: string;
    difficulty: string;
    xp_reward: number;
    created_at: string;
    learning_categories?: { name: string };
};

export default function LearningPage() {
    const [activeTab, setActiveTab] = useState<"categories" | "contents" | "quizzes">("categories");
    const [categories, setCategories] = useState<Category[]>([]);
    const [contents, setContents] = useState<LearningContent[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        if (activeTab === "categories") {
            const cats = await getLearningCategories();
            setCategories(cats as Category[]);
        } else if (activeTab === "contents") {
            const conts = await getLearningContents();
            setContents(conts as LearningContent[]);
        } else if (activeTab === "quizzes") {
            const qzs = await getLearningQuizzes();
            setQuizzes(qzs as Quiz[]);
        }
        setLoading(false);
    };

    const handleSave = async (data: any) => {
        let error;
        if (activeTab === "categories") {
            if (editingItem) {
                const res = await updateLearningCategory(editingItem.id, data);
                error = res.error;
            } else {
                const res = await createLearningCategory(data);
                error = res.error;
            }
        } else if (activeTab === "contents") {
            if (editingItem) {
                const res = await updateLearningContent(editingItem.id, data);
                error = res.error;
            } else {
                const res = await createLearningContent(data);
                error = res.error;
            }
        } else if (activeTab === "quizzes") {
            if (editingItem) {
                const res = await updateLearningQuiz(editingItem.id, data);
                error = res.error;
            } else {
                const res = await createLearningQuiz(data);
                error = res.error;
            }
        }

        if (!error) {
            alert("저장되었습니다.");
            setModalOpen(false);
            setEditingItem(null);
            loadData();
        } else {
            console.error(error);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">학습 콘텐츠 관리</h1>
                    <p className="text-slate-600">앱 내 학습 콘텐츠, 카테고리, 퀴즈를 관리합니다.</p>
                </div>
            </div>

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

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    로딩 중...
                </div>
            ) : (
                <>
                    {activeTab === "categories" && (
                        <CategoriesTab
                            categories={categories}
                            onRefresh={loadData}
                            onAdd={() => { setEditingItem(null); setModalOpen(true); }}
                            onEdit={(cat) => { setEditingItem(cat); setModalOpen(true); }}
                        />
                    )}
                    {activeTab === "contents" && (
                        <ContentsTab
                            contents={contents}
                            categories={categories}
                            onRefresh={loadData}
                            onAdd={() => { setEditingItem(null); setModalOpen(true); }}
                            onEdit={(item) => { setEditingItem(item); setModalOpen(true); }}
                        />
                    )}
                    {activeTab === "quizzes" && (
                        <QuizzesTab
                            quizzes={quizzes}
                            categories={categories}
                            onRefresh={loadData}
                            onAdd={() => { setEditingItem(null); setModalOpen(true); }}
                            onEdit={(quiz) => { setEditingItem(quiz); setModalOpen(true); }}
                        />
                    )}
                </>
            )}

            {modalOpen && (
                <LearningModal
                    type={activeTab}
                    editingItem={editingItem}
                    categories={categories}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

function CategoriesTab({ categories, onRefresh, onAdd, onEdit }: { categories: Category[]; onRefresh: () => void, onAdd: () => void, onEdit: (cat: Category) => void }) {
    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? 관련 콘텐츠도 삭제될 수 있습니다.")) return;
        const { error } = await deleteLearningCategory(id);
        if (!error) { alert("삭제되었습니다."); onRefresh(); }
        else alert("오류가 발생했습니다.");
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 카테고리 추가
                </button>
            </div>
            {categories.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                    카테고리가 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{cat.icon || "📚"}</span>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                                    <p className="text-sm text-slate-600">
                                        순서: {cat.display_order} | {cat.learning_contents?.[0]?.count || 0}개 콘텐츠
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEdit(cat)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ContentsTab({ contents, categories, onRefresh, onAdd, onEdit }: { contents: LearningContent[]; categories: Category[]; onRefresh: () => void, onAdd: () => void, onEdit: (item: LearningContent) => void }) {
    const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);
    const getTypeLabel = (type: string) => {
        const types: Record<string, { label: string; color: string }> = {
            term: { label: "용어", color: "bg-blue-100 text-blue-700" },
            concept: { label: "개념", color: "bg-purple-100 text-purple-700" },
            law: { label: "법령", color: "bg-amber-100 text-amber-700" },
            tip: { label: "팁", color: "bg-green-100 text-green-700" },
        };
        return types[type] || { label: type, color: "bg-slate-100 text-slate-700" };
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await deleteLearningContent(id);
        if (!error) { alert("삭제되었습니다."); onRefresh(); }
        else alert("오류가 발생했습니다.");
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 콘텐츠 추가
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {contents.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">콘텐츠가 없습니다.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">제목</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">유형</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">난이도</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contents.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{item.title}</div>
                                        <div className="text-xs text-slate-400 mt-1">{item.tags?.join(', ')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {getCategory(item.category_id)?.icon} {item.learning_categories?.name || getCategory(item.category_id)?.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeLabel(item.type).color}`}>
                                            {getTypeLabel(item.type).label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                                        {item.difficulty}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onEdit(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function QuizzesTab({ quizzes, categories, onRefresh, onAdd, onEdit }: { quizzes: Quiz[]; categories: Category[]; onRefresh: () => void, onAdd: () => void, onEdit: (q: Quiz) => void }) {
    const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const { error } = await deleteLearningQuiz(id);
        if (!error) { alert("삭제되었습니다."); onRefresh(); }
        else alert("오류가 발생했습니다.");
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    + 퀴즈 추가
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {quizzes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">퀴즈가 없습니다.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">질문</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">카테고리</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">유형</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">보상</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map((quiz) => (
                                <tr key={quiz.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 max-w-md truncate">{quiz.question}</div>
                                        <div className="text-xs text-slate-400 mt-1">정답: {quiz.correct_answer}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {getCategory(quiz.category_id)?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                                        {quiz.question_type}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-amber-600">
                                        +{quiz.xp_reward} XP
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onEdit(quiz)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">✏️</button>
                                            <button onClick={() => handleDelete(quiz.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function LearningModal({ type, editingItem, categories, onClose, onSave }: { type: string, editingItem: any, categories: Category[], onClose: () => void, onSave: (data: any) => void }) {
    const [options, setOptions] = useState<any[]>(editingItem?.options || [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
    ]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: any = {};
        formData.forEach((value, key) => {
            if (key === 'display_order' || key === 'xp_reward') {
                data[key] = parseInt(value as string);
            } else if (key === 'tags') {
                data[key] = (value as string).split(',').map(t => t.trim()).filter(t => t !== "");
            } else if (key === 'correct_option') {
                // Skip radio value
            } else {
                data[key] = value;
            }
        });

        if (type === 'quizzes') {
            data.options = options;
        }

        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8">
                <h2 className="text-xl font-bold mb-6">
                    {editingItem ? '수정' : '추가'} - {type === 'categories' ? '카테고리' : type === 'contents' ? '학습 콘텐츠' : '퀴즈'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'categories' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">카테고리명</label>
                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">아이콘 (이모지)</label>
                                    <input name="icon" defaultValue={editingItem?.icon || '📚'} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">정렬 순서</label>
                                    <input type="number" name="display_order" defaultValue={editingItem?.display_order || 0} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                                </div>
                            </div>
                        </>
                    )}

                    {type === 'contents' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
                                    <select name="category_id" defaultValue={editingItem?.category_id} required className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="">선택하세요</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">유형</label>
                                    <select name="type" defaultValue={editingItem?.type || 'term'} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="term">용어</option>
                                        <option value="concept">개념</option>
                                        <option value="law">법령</option>
                                        <option value="tip">팁</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
                                <input name="title" defaultValue={editingItem?.title} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                                <textarea name="description" defaultValue={editingItem?.description} required className="w-full px-4 py-2 border border-slate-200 rounded-lg h-32" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">예시/사례 (선택사항)</label>
                                <textarea name="example" defaultValue={editingItem?.example} className="w-full px-4 py-2 border border-slate-200 rounded-lg h-24" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">난이도</label>
                                    <select name="difficulty" defaultValue={editingItem?.difficulty || 'easy'} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="easy">쉬움</option>
                                        <option value="medium">보통</option>
                                        <option value="hard">어려움</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">태그 (쉼표 구분)</label>
                                    <input name="tags" defaultValue={editingItem?.tags?.join(', ')} placeholder="입찰, 기획, 조달" className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                                </div>
                            </div>
                        </>
                    )}

                    {type === 'quizzes' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
                                    <select name="category_id" defaultValue={editingItem?.category_id} required className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="">선택하세요</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">유형</label>
                                    <select name="question_type" defaultValue={editingItem?.question_type || 'multipleChoice'} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="multipleChoice">객관식</option>
                                        <option value="trueFalse">O/X</option>
                                        <option value="fillBlank">빈칸 채우기</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">질문</label>
                                <textarea name="question" defaultValue={editingItem?.question} required className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20" />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">보기 및 정답 설정</label>
                                {options.map((opt, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            placeholder={`선택지 ${i + 1}`}
                                            value={opt.text}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[i].text = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
                                        />
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="correct_option"
                                                checked={opt.isCorrect}
                                                onChange={() => {
                                                    const newOpts = options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                                                    setOptions(newOpts);
                                                }}
                                            />
                                            <span className="text-xs">정답</span>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">정답 텍스트 (UI 표시용)</label>
                                <input name="correct_answer" defaultValue={editingItem?.correct_answer} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">해설</label>
                                <textarea name="explanation" defaultValue={editingItem?.explanation} className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">난이도</label>
                                    <select name="difficulty" defaultValue={editingItem?.difficulty || 'easy'} className="w-full px-4 py-2 border border-slate-200 rounded-lg">
                                        <option value="easy">쉬움</option>
                                        <option value="medium">보통</option>
                                        <option value="hard">어려움</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">보상 (XP)</label>
                                    <input type="number" name="xp_reward" defaultValue={editingItem?.xp_reward || 10} required className="w-full px-4 py-2 border border-slate-200 rounded-lg" />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">취소</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
