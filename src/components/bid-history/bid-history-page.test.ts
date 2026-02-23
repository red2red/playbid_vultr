import { buildCommonParams, buildExportHref, buildListHref } from './bid-history-page';
import type { BidHistoryFilters } from '@/lib/bid/bid-history-types';

const baseFilters: BidHistoryFilters = {
    status: 'success',
    datePreset: '3m',
    dateFrom: '2026-01-01',
    dateTo: '2026-02-23',
    organization: '서울특별시',
    category: 'goods',
    query: '도로',
    onlyWithResult: true,
    sort: 'latest',
    page: 2,
    pageSize: 20,
};

function getParams(href: string): URLSearchParams {
    return new URL(`https://example.com${href}`).searchParams;
}

describe('bid-history-page filter helpers', () => {
    it('list 페이지 링크에 필터 파라미터를 유지한다', () => {
        const href = buildListHref(baseFilters, 5);
        const params = getParams(href);

        expect(href.startsWith('/bid_history?')).toBe(true);
        expect(params.get('status')).toBe('success');
        expect(params.get('datePreset')).toBe('3m');
        expect(params.get('dateFrom')).toBe('2026-01-01');
        expect(params.get('dateTo')).toBe('2026-02-23');
        expect(params.get('organization')).toBe('서울특별시');
        expect(params.get('category')).toBe('goods');
        expect(params.get('query')).toBe('도로');
        expect(params.get('sort')).toBe('latest');
        expect(params.get('pageSize')).toBe('20');
        expect(params.get('onlyWithResult')).toBe('1');
        expect(params.get('page')).toBe('5');
    });

    it('export 링크에도 동일 필터를 유지한다', () => {
        const href = buildExportHref(baseFilters);
        const params = getParams(href);

        expect(href.startsWith('/api/bid-history/export?')).toBe(true);
        expect(params.get('status')).toBe('success');
        expect(params.get('category')).toBe('goods');
        expect(params.get('query')).toBe('도로');
        expect(params.get('page')).toBeNull();
    });

    it('결과존재 필터가 꺼져 있으면 onlyWithResult를 포함하지 않는다', () => {
        const params = buildCommonParams({
            ...baseFilters,
            onlyWithResult: false,
            dateFrom: undefined,
            dateTo: undefined,
        });

        expect(params.get('onlyWithResult')).toBeNull();
        expect(params.get('dateFrom')).toBeNull();
        expect(params.get('dateTo')).toBeNull();
    });
});
