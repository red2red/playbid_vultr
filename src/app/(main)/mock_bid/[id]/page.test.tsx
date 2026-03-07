import { renderToStaticMarkup } from 'react-dom/server';
import MockBidRoutePage from './page';

const { getNoticeDetailByIdMock, createClientMock } = vi.hoisted(() => ({
    getNoticeDetailByIdMock: vi.fn(),
    createClientMock: vi.fn(),
}));

vi.mock('@/lib/bid/notice-detail-query', () => ({
    getNoticeDetailById: getNoticeDetailByIdMock,
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock,
}));

vi.mock('@/components/mock-bid/mock-bid-page', () => ({
    MockBidPage: ({ data }: { data: { notice: { title: string } } }) => <div>{data.notice.title}</div>,
}));

function createNotice(overrides: Record<string, unknown> = {}) {
    return {
        id: 'notice-1',
        noticeNumber: 'R26BK0001',
        noticeOrder: '000',
        title: '테스트 공고',
        organization: '조달청',
        budget: 100000000,
        estimatedPrice: 100000000,
        lowerLimitRate: 89.745,
        mockBidReady: true,
        ...overrides,
    };
}

describe('MockBidRoutePage', () => {
    beforeEach(() => {
        getNoticeDetailByIdMock.mockReset();
        createClientMock.mockReset();
    });

    it('공식 예가범위 정보가 없으면 unavailable 상태를 렌더링한다', async () => {
        getNoticeDetailByIdMock.mockResolvedValue(
            createNotice({ lowerLimitRate: 89.745, mockBidReady: false })
        );

        const ui = await MockBidRoutePage({ params: { id: 'notice-1' } });
        const markup = renderToStaticMarkup(ui);

        expect(markup).toContain('공식 예가범위 정보가 없어');
    });
});
