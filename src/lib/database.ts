import { createClient } from './supabase/client';

type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

type UserLevelInfo = {
    current_level?: number;
    total_xp?: number;
};

type ProfileRow = {
    user_levels?: UserLevelInfo | UserLevelInfo[];
    is_active?: boolean;
    [key: string]: unknown;
};

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

        // 활성 사용자 (최근 7일 로그인 또는 is_active)
        const { count: activeUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        return {
            totalUsers: totalUsers ?? 0,
            todayUsers: todayUsers ?? 0,
            activeUsers: activeUsers ?? 0,
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
            .select('*, user_levels(current_level, total_xp)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // 검색 필터
        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        // 상태 필터
        if (status && status !== 'all') {
            query = query.eq('is_active', status === 'active');
        }

        // 구독 필터
        if (subscription && subscription !== 'all') {
            query = query.eq('subscription', subscription);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        // 데이터 가공 (중첩된 객체 평탄화)
        // 1:1 관계인 경우 Supabase(PostgREST) 버전/설정에 따라 객체({}) 또는 배열([])로 반환될 수 있음
        const formattedUsers = (data ?? []).map((u: ProfileRow) => {
            const levelInfo = Array.isArray(u.user_levels) ? u.user_levels[0] : u.user_levels;
            return {
                ...u,
                current_level: levelInfo?.current_level ?? 1,
                total_xp: levelInfo?.total_xp ?? 0,
                status: u.is_active ? 'active' : 'inactive'
            };
        });

        return {
            users: formattedUsers,
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

// 사용자 정보 수정
export async function updateUser(id: string, updates: Record<string, unknown>) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating user:', error);
        return { data: null, error };
    }
}

// 사용자 삭제 (비활성화)
export async function deleteUser(id: string) {
    const supabase = createClient();
    try {
        // 실제 삭제 대신 비활성화 처리
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { error };
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

// 공지사항 수정
export async function updateAnnouncement(id: string, announcement: {
    title?: string;
    content?: string;
    category?: string;
    status?: string;
    is_popup?: boolean;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('announcements')
            .update(announcement)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating announcement:', error);
        return { data: null, error };
    }
}

// 공지사항 삭제
export async function deleteAnnouncement(id: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return { error };
    }
}

// 학습 카테고리 목록
export async function getLearningCategories() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('learning_categories')
            .select('*, learning_contents(count)')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching learning categories:', error);
        return [];
    }
}

// 학습 카테고리 생성
export async function createLearningCategory(category: {
    name: string;
    icon: string;
    display_order: number;
}) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('learning_categories')
            .insert([category])
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating learning category:', error);
        return { data: null, error };
    }
}

// 학습 카테고리 수정
export async function updateLearningCategory(id: string, category: {
    name?: string;
    icon?: string;
    display_order?: number;
}) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('learning_categories')
            .update(category)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating learning category:', error);
        return { data: null, error };
    }
}

// 학습 카테고리 삭제
export async function deleteLearningCategory(id: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('learning_categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting learning category:', error);
        return { error };
    }
}

// 학습 콘텐츠 목록 가져오기
export async function getLearningContents(categoryId?: string) {
    const supabase = createClient();

    try {
        let query = supabase
            .from('learning_contents')
            .select('*, learning_categories(name)')
            .order('created_at', { ascending: false });

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching learning contents:', error);
        return [];
    }
}

// 학습 콘텐츠 생성
export async function createLearningContent(content: {
    category_id: string;
    type: string;
    title: string;
    description: string;
    example?: string;
    difficulty: string;
    tags: string[];
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('learning_contents')
            .insert([content])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating learning content:', error);
        return { data: null, error };
    }
}

// 학습 콘텐츠 수정
export async function updateLearningContent(id: string, content: {
    category_id?: string;
    type?: string;
    title?: string;
    description?: string;
    example?: string;
    difficulty?: string;
    tags?: string[];
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('learning_contents')
            .update(content)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating learning content:', error);
        return { data: null, error };
    }
}

// 학습 콘텐츠 삭제
export async function deleteLearningContent(id: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('learning_contents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting learning content:', error);
        return { error };
    }
}

// 학습 퀴즈 목록
export async function getLearningQuizzes(categoryId?: string) {
    const supabase = createClient();
    try {
        let query = supabase
            .from('quizzes')
            .select('*, learning_categories(name)')
            .order('created_at', { ascending: false });

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching learning quizzes:', error);
        return [];
    }
}

// 학습 퀴즈 생성
export async function createLearningQuiz(quiz: {
    category_id: string;
    question: string;
    question_type: string;
    options: JsonValue;
    correct_answer: string;
    explanation?: string;
    difficulty: string;
    xp_reward: number;
}) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .insert([quiz])
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating learning quiz:', error);
        return { data: null, error };
    }
}

// 학습 퀴즈 수정
export async function updateLearningQuiz(id: string, quiz: {
    category_id?: string;
    question?: string;
    question_type?: string;
    options?: JsonValue;
    correct_answer?: string;
    explanation?: string;
    difficulty?: string;
    xp_reward?: number;
}) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .update(quiz)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating learning quiz:', error);
        return { data: null, error };
    }
}

// 학습 퀴즈 삭제
export async function deleteLearningQuiz(id: string) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('quizzes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting learning quiz:', error);
        return { error };
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

// 뱃지 생성
export async function createBadge(badge: {
    name: string;
    description: string;
    icon: string;
    requirement: string;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('badges')
            .insert([badge])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating badge:', error);
        return { data: null, error };
    }
}

// 뱃지 수정
export async function updateBadge(id: string, badge: {
    name?: string;
    description?: string;
    icon?: string;
    requirement?: string;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('badges')
            .update(badge)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating badge:', error);
        return { data: null, error };
    }
}

// 뱃지 삭제
export async function deleteBadge(id: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('badges')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting badge:', error);
        return { error };
    }
}

// 미션 생성
export async function createMission(mission: {
    title: string;
    description: string;
    type: string;
    target_count: number;
    reward_points: number;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('missions')
            .insert([mission])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating mission:', error);
        return { data: null, error };
    }
}

// 미션 수정
export async function updateMission(id: string, mission: {
    title?: string;
    description?: string;
    type?: string;
    target_count?: number;
    reward_points?: number;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('missions')
            .update(mission)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating mission:', error);
        return { data: null, error };
    }
}

// 미션 삭제
export async function deleteMission(id: string) {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('missions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting mission:', error);
        return { error };
    }
}

// 리더보드 조회
export async function getLeaderboard(period: 'weekly' | 'monthly' = 'weekly', limit = 10) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('user_ranking')
            .select('*, profiles(username, avatar_url)')
            .eq('period', period)
            .order('rank', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data ?? [];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

// 리더보드 리셋
export async function resetLeaderboard(period: 'weekly' | 'monthly') {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('user_ranking')
            .delete()
            .eq('period', period);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error(`Error resetting ${period} leaderboard:`, error);
        return { error };
    }
}

// 입찰 공고 목록 가져오기
export async function getBidNotices(options?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
}) {
    const supabase = createClient();
    const { status, category, page = 1, limit = 20 } = options ?? {};

    try {
        let query = supabase
            .from('bid_notices')
            .select('*', { count: 'exact' })
            .order('bid_clse_dt', { ascending: true })
            .range((page - 1) * limit, page * limit - 1);

        // 상태 필터 (active = 마감일이 미래, closed = 마감일이 과거)
        if (status === 'active') {
            query = query.gte('bid_clse_dt', new Date().toISOString());
        } else if (status === 'closed') {
            query = query.lt('bid_clse_dt', new Date().toISOString());
        }

        if (category && category !== 'all') {
            query = query.eq('api_category', category);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return {
            notices: data ?? [],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('Error fetching bid notices:', error);
        return {
            notices: [],
            total: 0,
        };
    }
}

// 입찰 공고 통계
export async function getBidNoticeStats() {
    const supabase = createClient();
    const now = new Date().toISOString();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    try {
        // 전체 공고 수
        const { count: totalCount } = await supabase
            .from('bid_notices')
            .select('*', { count: 'exact', head: true });

        // 진행 중 공고 수
        const { count: activeCount } = await supabase
            .from('bid_notices')
            .select('*', { count: 'exact', head: true })
            .gte('bid_clse_dt', now);

        // 오늘 마감 공고 수
        const { count: todayCount } = await supabase
            .from('bid_notices')
            .select('*', { count: 'exact', head: true })
            .gte('bid_clse_dt', now)
            .lte('bid_clse_dt', today.toISOString());

        // 모의입찰 진행 중인 공고 수 (user_bid_history 테이블에서 카운트)
        const { count: mockBidCount } = await supabase
            .from('user_bid_history')
            .select('bid_ntce_no', { count: 'exact', head: true });

        return {
            total: totalCount ?? 0,
            active: activeCount ?? 0,
            todayDeadline: todayCount ?? 0,
            mockBidActive: mockBidCount ?? 0,
        };
    } catch (error) {
        console.error('Error fetching bid notice stats:', error);
        return {
            total: 0,
            active: 0,
            todayDeadline: 0,
            mockBidActive: 0,
        };
    }
}

// 입찰 공고 동기화 (KONEPS API)
export async function syncBidNotices() {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.functions.invoke('fetch-koneps-bids');

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error syncing bid notices:', error);
        return { data: null, error };
    }
}

// 푸시 알림 이력 가져오기
export async function getPushNotifications(options?: {
    page?: number;
    limit?: number;
}) {
    const supabase = createClient();
    const { page = 1, limit = 20 } = options ?? {};

    try {
        const { data, count, error } = await supabase
            .from('push_notifications_history')
            .select('*', { count: 'exact' })
            .order('sent_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        return {
            notifications: data ?? [],
            total: count ?? 0,
        };
    } catch (error) {
        console.error('Error fetching push notifications:', error);
        return {
            notifications: [],
            total: 0,
        };
    }
}

// 푸시 알림 발송 (테스트용 - 실제 발송은 서버리스 함수 권장)
export async function sendPushNotification(notification: {
    title: string;
    body: string;
    target_type: string;
}) {
    const supabase = createClient();

    try {
        // 1. 발송 이력 먼저 저장
        const { data: historyData, error: historyError } = await supabase
            .from('push_notifications_history')
            .insert([{
                ...notification,
                status: 'sending',
                recipient_count: 0 // 실제 발송 로직에서 업데이트 필요
            }])
            .select()
            .single();

        if (historyError) throw historyError;

        // 2. 실제 푸시 발송 Edge Function 호출
        const { error } = await supabase.functions.invoke('send-admin-push', {
            body: {
                title: notification.title,
                body: notification.body,
                target_type: notification.target_type,
                history_id: historyData.id
            }
        });

        if (error) throw error;

        return { data: historyData, error: null };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { data: null, error };
    }
}

// 푸시 관련 통계
export async function getPushStats() {
    const supabase = createClient();

    try {
        // 알림 허용 사용자 수 (FCM 토큰 보유자 기준)
        const { count: tokenCount } = await supabase
            .from('user_fcm_tokens')
            .select('user_id', { count: 'exact', head: true });

        // 총 발송 건수 (이력 기반)
        const { data: history, error: historyError } = await supabase
            .from('push_notifications_history')
            .select('recipient_count');

        if (historyError) throw historyError;

        const totalSent = history?.reduce((acc, curr) => acc + (curr.recipient_count || 0), 0) || 0;

        return {
            enabledUsers: tokenCount ?? 0,
            totalSentCount: totalSent,
        };
    } catch (error) {
        console.error('Error fetching push stats:', error);
        return {
            enabledUsers: 0,
            totalSentCount: 0,
        };
    }
}
