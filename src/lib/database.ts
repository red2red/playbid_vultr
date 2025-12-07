import { createClient } from './supabase/client';

// 통계 데이터 가져오기
export async function getDashboardStats() {
    const supabase = createClient();

    try {
        // 전체 사용자 수
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 오늘 가입자 수
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // 프리미엄 구독자 수
        const { count: premiumUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('subscription', 'premium');

        return {
            totalUsers: totalUsers ?? 0,
            todayUsers: todayUsers ?? 0,
            activeUsers: Math.floor((totalUsers ?? 0) * 0.37), // 임시 계산
            premiumUsers: premiumUsers ?? 0,
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            totalUsers: 0,
            todayUsers: 0,
            activeUsers: 0,
            premiumUsers: 0,
        };
    }
}

// 사용자 목록 가져오기
export async function getUsers(options?: {
    search?: string;
    status?: string;
    subscription?: string;
    page?: number;
    limit?: number;
}) {
    const supabase = createClient();
    const { search, status, subscription, page = 1, limit = 20 } = options ?? {};

    try {
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // 검색 필터
        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
        }

        // 구독 필터
        if (subscription && subscription !== 'all') {
            query = query.eq('subscription', subscription);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return {
            users: data ?? [],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return {
            users: [],
            total: 0,
        };
    }
}

// 최근 가입 사용자
export async function getRecentUsers(limit = 5) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching recent users:', error);
        return [];
    }
}

// 공지사항 목록 가져오기
export async function getAnnouncements(options?: {
    status?: string;
    page?: number;
    limit?: number;
}) {
    const supabase = createClient();
    const { status, page = 1, limit = 20 } = options ?? {};

    try {
        let query = supabase
            .from('announcements')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return {
            announcements: data ?? [],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return {
            announcements: [],
            total: 0,
        };
    }
}

// 공지사항 생성
export async function createAnnouncement(announcement: {
    title: string;
    content: string;
    category: string;
    status: string;
    is_popup: boolean;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('announcements')
            .insert([announcement])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return { data: null, error };
    }
}

// 학습 카테고리 목록
export async function getLearningCategories() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('learning_categories')
            .select('*, learning_contents(count)')
            .order('order', { ascending: true });

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching learning categories:', error);
        return [];
    }
}

// 미션 목록
export async function getMissions() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching missions:', error);
        return [];
    }
}

// 뱃지 목록
export async function getBadges() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('badges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching badges:', error);
        return [];
    }
}
