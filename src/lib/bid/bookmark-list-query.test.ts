import { isUrgentDeadline } from './bookmark-list-query';

describe('bookmark-list-query helpers', () => {
    const fixedNow = new Date('2026-02-23T00:00:00.000Z');

    it('24시간 이내 마감은 urgent로 판단한다', () => {
        expect(isUrgentDeadline('2026-02-23T12:00:00.000Z', fixedNow)).toBe(true);
        expect(isUrgentDeadline('2026-02-24T00:00:00.000Z', fixedNow)).toBe(true);
    });

    it('24시간 초과 또는 이미 마감된 경우 urgent가 아니다', () => {
        expect(isUrgentDeadline('2026-02-24T00:00:01.000Z', fixedNow)).toBe(false);
        expect(isUrgentDeadline('2026-02-22T23:59:59.000Z', fixedNow)).toBe(false);
    });

    it('유효하지 않은 입력은 false를 반환한다', () => {
        expect(isUrgentDeadline(undefined, fixedNow)).toBe(false);
        expect(isUrgentDeadline('', fixedNow)).toBe(false);
        expect(isUrgentDeadline('invalid-date', fixedNow)).toBe(false);
    });
});
