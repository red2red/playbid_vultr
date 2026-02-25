import { describe, expect, it, vi } from 'vitest';
import { authorizedFetch, AuthorizedFetchAuthError } from './authorized-fetch';

describe('authorizedFetch', () => {
    it('401 이후 refresh 성공이면 1회 재시도 결과를 반환한다', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

        const refreshMock = vi.fn().mockResolvedValue({
            data: {
                session: {
                    access_token: 'token',
                },
            },
            error: null,
        });

        const onAuthFailure = vi.fn();

        const response = await authorizedFetch('/api/bookmarks/toggle', {}, {
            fetchImpl: fetchMock,
            refreshSession: refreshMock,
            onAuthFailure,
        });

        expect(response.status).toBe(200);
        expect(refreshMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(onAuthFailure).not.toHaveBeenCalled();
    });

    it('refresh 실패면 AUTH_REFRESH_FAILED 에러를 던진다', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response('unauthorized', { status: 401 }));

        const refreshMock = vi.fn().mockResolvedValue({
            data: {
                session: null,
            },
            error: new Error('expired'),
        });

        const onAuthFailure = vi.fn();

        await expect(
            authorizedFetch('/api/notifications/read', {}, {
                fetchImpl: fetchMock,
                refreshSession: refreshMock,
                onAuthFailure,
            })
        ).rejects.toMatchObject<AuthorizedFetchAuthError>({
            code: 'AUTH_REFRESH_FAILED',
        });

        expect(onAuthFailure).toHaveBeenCalledWith('AUTH_REFRESH_FAILED');
    });

    it('refresh 성공 후에도 401이면 AUTH_SESSION_EXPIRED 에러를 던진다', async () => {
        const fetchMock = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }))
            .mockResolvedValueOnce(new Response('unauthorized-again', { status: 401 }));

        const refreshMock = vi.fn().mockResolvedValue({
            data: {
                session: {
                    access_token: 'new-token',
                },
            },
            error: null,
        });

        const onAuthFailure = vi.fn();

        await expect(
            authorizedFetch('/api/bookmarks/toggle', {}, {
                fetchImpl: fetchMock,
                refreshSession: refreshMock,
                onAuthFailure,
            })
        ).rejects.toMatchObject<AuthorizedFetchAuthError>({
            code: 'AUTH_SESSION_EXPIRED',
        });

        expect(onAuthFailure).toHaveBeenCalledWith('AUTH_SESSION_EXPIRED');
    });
});
