import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NoticeQuickActionsCard } from '../notice-quick-actions-card';

const pushMock = vi.fn();
const runWithAuthMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}));

vi.mock('@/hooks/use-auth-action', () => ({
    useAuthAction: () => ({
        runWithAuth: runWithAuthMock,
    }),
}));

describe('NoticeQuickActionsCard', () => {
    beforeEach(() => {
        pushMock.mockReset();
        runWithAuthMock.mockReset();
    });

    it('인증 통과 시 모의입찰 버튼이 이력 화면으로 이동한다', async () => {
        runWithAuthMock.mockImplementation(async (action: () => Promise<void> | void) => {
            await action();
            return true;
        });

        render(
            <NoticeQuickActionsCard
                noticeId="notice-123"
                sourceUrl="https://www.g2b.go.kr"
                qualificationRequired
            />
        );

        fireEvent.click(screen.getByRole('button', { name: '모의입찰 시작하기' }));

        await waitFor(() => expect(runWithAuthMock).toHaveBeenCalledTimes(1));
        expect(pushMock).toHaveBeenCalledWith('/bid_history?from=mock-bid&noticeId=notice-123');
    });

    it('인증 실패 시 보호 액션 라우팅을 실행하지 않는다', async () => {
        runWithAuthMock.mockResolvedValue(false);

        render(
            <NoticeQuickActionsCard
                noticeId="notice-abc"
                sourceUrl="https://www.g2b.go.kr"
                qualificationRequired
            />
        );

        fireEvent.click(screen.getByRole('button', { name: '적격심사 계산' }));

        await waitFor(() => expect(runWithAuthMock).toHaveBeenCalledTimes(1));
        expect(pushMock).not.toHaveBeenCalled();
    });
});
