import { createClient } from '@/lib/supabase/server';

export type LearningFlashcardFilter = 'all' | 'term' | 'concept' | 'law' | 'tip';

export interface LearningCategorySummary {
    id: string;
    name: string;
    icon: string;
    displayOrder: number;
    contentCount: number;
}

export interface LearningContentItem {
    id: string;
    categoryId: string;
    categoryName: string;
    type: string;
    title: string;
    description: string;
    example: string | null;
    difficulty: string;
    tags: string[];
}

export interface LearningQuizItem {
    id: string;
    categoryId: string;
    categoryName: string;
    question: string;
    questionType: string;
    difficulty: string;
    xpReward: number;
    explanation: string | null;
}

export interface LearningOverviewData {
    authRequired: boolean;
    categories: LearningCategorySummary[];
    featuredContents: LearningContentItem[];
    quizPreview: LearningQuizItem[];
}

export interface LearningQuizData {
    authRequired: boolean;
    quizzes: LearningQuizItem[];
}

export interface LearningFlashcardData {
    authRequired: boolean;
    selectedFilter: LearningFlashcardFilter;
    cards: LearningContentItem[];
}

type AnyRecord = Record<string, unknown>;
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const FLASHCARD_FILTER_ALIASES: Record<string, LearningFlashcardFilter> = {
    all: 'all',
    term: 'term',
    concept: 'concept',
    law: 'law',
    tip: 'tip',
};

function asRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as AnyRecord;
}

function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return null;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => asString(item))
        .filter((item): item is string => item !== null);
}

async function getCurrentUserId(supabase: SupabaseServerClient): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
}

function normalizeCategoryRows(rows: AnyRecord[]): LearningCategorySummary[] {
    return rows.map((row, index) => {
        const contentsRaw = row.learning_contents;
        const contents = Array.isArray(contentsRaw) ? asRecord(contentsRaw[0]) : asRecord(contentsRaw);
        const contentCount = Math.max(0, Math.round(asNumber(contents?.count) ?? 0));

        return {
            id: asString(row.id) ?? `category-${index}`,
            name: asString(row.name) ?? '기타',
            icon: asString(row.icon) ?? '📚',
            displayOrder: Math.max(0, Math.round(asNumber(row.display_order) ?? index)),
            contentCount,
        };
    });
}

function normalizeContentRows(rows: AnyRecord[]): LearningContentItem[] {
    return rows.map((row, index) => {
        const categoryRaw = row.learning_categories;
        const category = Array.isArray(categoryRaw) ? asRecord(categoryRaw[0]) : asRecord(categoryRaw);

        return {
            id: asString(row.id) ?? `content-${index}`,
            categoryId: asString(row.category_id) ?? '',
            categoryName: asString(category?.name) ?? '기타',
            type: asString(row.type) ?? 'term',
            title: asString(row.title) ?? '학습 콘텐츠',
            description: asString(row.description) ?? '',
            example: asString(row.example),
            difficulty: asString(row.difficulty) ?? 'easy',
            tags: asStringArray(row.tags),
        };
    });
}

function normalizeQuizRows(rows: AnyRecord[]): LearningQuizItem[] {
    return rows.map((row, index) => {
        const categoryRaw = row.learning_categories;
        const category = Array.isArray(categoryRaw) ? asRecord(categoryRaw[0]) : asRecord(categoryRaw);

        return {
            id: asString(row.id) ?? `quiz-${index}`,
            categoryId: asString(row.category_id) ?? '',
            categoryName: asString(category?.name) ?? '기타',
            question: asString(row.question) ?? '문제',
            questionType: asString(row.question_type) ?? 'multipleChoice',
            difficulty: asString(row.difficulty) ?? 'easy',
            xpReward: Math.max(0, Math.round(asNumber(row.xp_reward) ?? 0)),
            explanation: asString(row.explanation),
        };
    });
}

async function readCategories(supabase: SupabaseServerClient): Promise<LearningCategorySummary[]> {
    const { data } = await supabase
        .from('learning_categories')
        .select('id, name, icon, display_order, learning_contents(count)')
        .order('display_order', { ascending: true });

    const rows = Array.isArray(data)
        ? data
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    return normalizeCategoryRows(rows);
}

async function readContents(
    supabase: SupabaseServerClient,
    limit = 24,
    type?: Exclude<LearningFlashcardFilter, 'all'>
): Promise<LearningContentItem[]> {
    let query = supabase
        .from('learning_contents')
        .select('id, category_id, type, title, description, example, difficulty, tags, learning_categories(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (type) {
        query = query.eq('type', type);
    }

    const { data } = await query;
    const rows = Array.isArray(data)
        ? data
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    return normalizeContentRows(rows);
}

async function readQuizzes(supabase: SupabaseServerClient, limit = 20): Promise<LearningQuizItem[]> {
    const { data } = await supabase
        .from('quizzes')
        .select('id, category_id, question, question_type, difficulty, xp_reward, explanation, learning_categories(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

    const rows = Array.isArray(data)
        ? data
            .map((item) => asRecord(item))
            .filter((item): item is AnyRecord => item !== null)
        : [];

    return normalizeQuizRows(rows);
}

export function normalizeFlashcardFilter(raw: string | string[] | undefined): LearningFlashcardFilter {
    const value = Array.isArray(raw) ? raw[0] : raw;
    const normalized = (value ?? '').toLowerCase().trim();
    return FLASHCARD_FILTER_ALIASES[normalized] ?? 'all';
}

export async function getLearningOverviewData(): Promise<LearningOverviewData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
        return {
            authRequired: true,
            categories: [],
            featuredContents: [],
            quizPreview: [],
        };
    }

    const [categories, featuredContents, quizPreview] = await Promise.all([
        readCategories(supabase),
        readContents(supabase, 8),
        readQuizzes(supabase, 6),
    ]);

    return {
        authRequired: false,
        categories,
        featuredContents,
        quizPreview,
    };
}

export async function getLearningQuizData(): Promise<LearningQuizData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
        return {
            authRequired: true,
            quizzes: [],
        };
    }

    const quizzes = await readQuizzes(supabase, 30);
    return {
        authRequired: false,
        quizzes,
    };
}

export async function getLearningFlashcardData(
    rawFilter: string | string[] | undefined
): Promise<LearningFlashcardData> {
    const supabase = await createClient();
    const userId = await getCurrentUserId(supabase);
    const selectedFilter = normalizeFlashcardFilter(rawFilter);

    if (!userId) {
        return {
            authRequired: true,
            selectedFilter,
            cards: [],
        };
    }

    const cards = await readContents(
        supabase,
        40,
        selectedFilter === 'all' ? undefined : selectedFilter
    );

    return {
        authRequired: false,
        selectedFilter,
        cards,
    };
}
