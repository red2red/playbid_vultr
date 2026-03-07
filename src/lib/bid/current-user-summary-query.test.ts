import { createClient } from '@/lib/supabase/server';

const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

import {
    clearCurrentUserSummaryCacheForTest,
    getCurrentUserSummary,
} from './current-user-summary-query';

type SelectResult = {
    data: unknown[] | null;
    error: unknown | null;
};

function createEqLimitQuery(result: SelectResult) {
    const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        limit: vi.fn(async () => result),
    };

    return query;
}

function createEqOrderLimitQuery(result: SelectResult) {
    const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        order: vi.fn(() => query),
        limit: vi.fn(async () => result),
    };

    return query;
}

describe('getCurrentUserSummary', () => {
    const createClientMocked = vi.mocked(createClient);

    beforeEach(() => {
        createClientMocked.mockReset();
        clearCurrentUserSummaryCacheForTest();
    });

    it('비로그인 상태면 기본 사용자 정보를 반환한다', async () => {
        createClientMocked.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: null },
                    error: null,
                }),
            },
            from: vi.fn(),
        } as never);

        const summary = await getCurrentUserSummary();

        expect(summary).toEqual({
            userId: null,
            email: null,
            displayName: '사용자',
            avatarUrl: null,
            levelLabel: null,
        });
    });

    it('user_profiles.nickname을 최우선 displayName으로 사용한다', async () => {
        createClientMocked.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'user-1',
                            email: 'tester@example.com',
                        },
                    },
                    error: null,
                }),
            },
            from: vi.fn((table: string) => {
                if (table === 'user_profiles') {
                    return createEqLimitQuery({
                        data: [
                            {
                                nickname: '테스터닉네임',
                                avatar_url: 'https://example.com/avatar.png',
                            },
                        ],
                        error: null,
                    });
                }

                if (table === 'profiles') {
                    return createEqLimitQuery({
                        data: [
                            {
                                full_name: '프로필 이름',
                                username: 'profile_user',
                                avatar_url: 'https://example.com/profile.png',
                            },
                        ],
                        error: null,
                    });
                }

                if (table === 'user_levels') {
                    return createEqOrderLimitQuery({
                        data: [
                            {
                                current_level: 14,
                            },
                        ],
                        error: null,
                    });
                }

                return createEqLimitQuery({ data: [], error: null });
            }),
        } as never);

        const summary = await getCurrentUserSummary();

        expect(summary.displayName).toBe('테스터닉네임');
        expect(summary.avatarUrl).toBe('https://example.com/avatar.png');
        expect(summary.levelLabel).toBe('Lv.14');
    });

    it('이름 소스가 없으면 이메일 아이디를 displayName으로 사용한다', async () => {
        createClientMocked.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'user-2',
                            email: 'zend911@gmail.com',
                        },
                    },
                    error: null,
                }),
            },
            from: vi.fn((table: string) => {
                if (table === 'user_profiles') {
                    return createEqLimitQuery({ data: [], error: null });
                }

                if (table === 'profiles') {
                    return createEqLimitQuery({ data: [], error: null });
                }

                if (table === 'user_levels') {
                    return createEqOrderLimitQuery({ data: [], error: null });
                }

                return createEqLimitQuery({ data: [], error: null });
            }),
        } as never);

        const summary = await getCurrentUserSummary();

        expect(summary.displayName).toBe('zend911');
        expect(summary.levelLabel).toBeNull();
    });

    it('user_levels 스키마가 없어도 예외 없이 레벨 라벨을 비운다', async () => {
        createClientMocked.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: {
                        user: {
                            id: 'user-3',
                            email: 'profile@example.com',
                        },
                    },
                    error: null,
                }),
            },
            from: vi.fn((table: string) => {
                if (table === 'user_profiles') {
                    return createEqLimitQuery({
                        data: [{ nickname: '프로필닉' }],
                        error: null,
                    });
                }

                if (table === 'profiles') {
                    return createEqLimitQuery({ data: [], error: null });
                }

                if (table === 'user_levels') {
                    return createEqOrderLimitQuery({
                        data: null,
                        error: { code: '42P01', message: 'relation "user_levels" does not exist' },
                    });
                }

                return createEqLimitQuery({ data: [], error: null });
            }),
        } as never);

        const summary = await getCurrentUserSummary();

        expect(summary.displayName).toBe('프로필닉');
        expect(summary.levelLabel).toBeNull();
    });
});
