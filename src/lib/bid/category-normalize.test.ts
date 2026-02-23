import {
    getCategoryLabel,
    getCategoryQueryValues,
    getDisplayCategory,
    normalizeCategory,
} from './category-normalize';

describe('category-normalize', () => {
    it('product/goods를 goods로 정규화한다', () => {
        expect(normalizeCategory('product')).toBe('goods');
        expect(normalizeCategory('goods')).toBe('goods');
    });

    it('공사/용역 카테고리를 정규화한다', () => {
        expect(normalizeCategory('construction')).toBe('construction');
        expect(normalizeCategory(' SERVICE ')).toBe('service');
    });

    it('표시 카테고리에서 goods는 product로 변환한다', () => {
        expect(getDisplayCategory('goods')).toBe('product');
        expect(getDisplayCategory('product')).toBe('product');
    });

    it('조회 쿼리값에서 goods/product를 함께 반환한다', () => {
        expect(getCategoryQueryValues('product')).toEqual(['goods', 'product']);
        expect(getCategoryQueryValues('goods')).toEqual(['goods', 'product']);
    });

    it('미지정 카테고리는 전체 카테고리 조회값을 반환한다', () => {
        expect(getCategoryQueryValues(undefined)).toEqual(['construction', 'service', 'goods', 'product']);
        expect(getCategoryQueryValues('unknown')).toEqual(['construction', 'service', 'goods', 'product']);
    });

    it('카테고리 라벨을 Flutter 계약 기준으로 반환한다', () => {
        expect(getCategoryLabel('construction')).toBe('공사');
        expect(getCategoryLabel('service')).toBe('용역');
        expect(getCategoryLabel('goods')).toBe('물품');
        expect(getCategoryLabel('product')).toBe('물품');
        expect(getCategoryLabel('unknown')).toBe('기타');
    });
});
