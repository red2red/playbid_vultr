import {
    getOpeningStatusLabel,
    mapOpeningProgressToStatus,
    parseOpeningCorpInfo,
} from './opening-query';

describe('opening-query helpers', () => {
    it('openg_corp_info 문자열을 파싱한다', () => {
        const parsed = parseOpeningCorpInfo('한빛엔지니어링^1234567890^홍길동^128500000^87.412');

        expect(parsed).toEqual({
            name: '한빛엔지니어링',
            amount: 128500000,
            rate: 87.412,
        });
    });

    it('빈 openg_corp_info를 안전하게 처리한다', () => {
        const parsed = parseOpeningCorpInfo('');
        expect(parsed).toEqual({
            name: null,
            amount: null,
            rate: null,
        });
    });

    it('진행구분 문자열을 상태 값으로 매핑한다', () => {
        expect(mapOpeningProgressToStatus('개찰완료')).toBe('awarded');
        expect(mapOpeningProgressToStatus('유찰')).toBe('failed');
        expect(mapOpeningProgressToStatus('재입찰')).toBe('rebid');
        expect(mapOpeningProgressToStatus('기타')).toBe('unknown');
    });

    it('상태 라벨을 한글로 반환한다', () => {
        expect(getOpeningStatusLabel('awarded')).toBe('낙찰');
        expect(getOpeningStatusLabel('failed')).toBe('유찰');
        expect(getOpeningStatusLabel('rebid')).toBe('재공고');
        expect(getOpeningStatusLabel('unknown')).toBe('미정');
    });
});
