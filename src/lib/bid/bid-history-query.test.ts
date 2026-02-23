import {
    escapeCsvField,
    getBidHistoryStatusLabel,
    mapBidHistoryResultToStatus,
} from './bid-history-query';

describe('bid-history-query helpers', () => {
    it('result_type를 웹 상태로 정규화한다', () => {
        expect(mapBidHistoryResultToStatus('success')).toBe('success');
        expect(mapBidHistoryResultToStatus('exact')).toBe('success');
        expect(mapBidHistoryResultToStatus('close')).toBe('success');
        expect(mapBidHistoryResultToStatus('fail')).toBe('fail');
        expect(mapBidHistoryResultToStatus('miss')).toBe('fail');
        expect(mapBidHistoryResultToStatus('pending')).toBe('pending');
        expect(mapBidHistoryResultToStatus('void')).toBe('void');
    });

    it('is_success 플래그를 보조적으로 사용한다', () => {
        expect(mapBidHistoryResultToStatus(undefined, true)).toBe('success');
        expect(mapBidHistoryResultToStatus(undefined, false)).toBe('fail');
        expect(mapBidHistoryResultToStatus(undefined, null)).toBe('unknown');
    });

    it('상태 라벨을 한글로 반환한다', () => {
        expect(getBidHistoryStatusLabel('success')).toBe('낙찰');
        expect(getBidHistoryStatusLabel('fail')).toBe('패찰');
        expect(getBidHistoryStatusLabel('pending')).toBe('대기');
        expect(getBidHistoryStatusLabel('void')).toBe('유찰');
        expect(getBidHistoryStatusLabel('unknown')).toBe('미정');
    });

    it('CSV 필드를 올바르게 escape한다', () => {
        expect(escapeCsvField('plain')).toBe('plain');
        expect(escapeCsvField('a,b')).toBe('"a,b"');
        expect(escapeCsvField('a"b')).toBe('"a""b"');
        expect(escapeCsvField('line\nnext')).toBe('"line\nnext"');
    });
});
