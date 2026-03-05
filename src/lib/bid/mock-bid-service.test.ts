import {
    buildMockBidStep1Data,
    calculateBidAmountByAdjustmentRate,
    calculateBidRateAgainstBasic,
    calculateLowerBidPrice,
    calculatePlannedPrice,
    evaluateMockBidOutcome,
    toggleEstimateSelection,
} from './mock-bid-service';

describe('mock-bid-service', () => {
    it('기초금액 기준으로 15개 예비가격을 생성한다', () => {
        const data = buildMockBidStep1Data({
            id: 'notice-1',
            title: 'AI 기반 입찰 시스템 구축',
            organization: '서울특별시',
            basicAmount: 100_000_000,
        });

        expect(data.estimates).toHaveLength(15);
        expect(data.estimates[0].amount).toBeLessThan(100_000_000);
        expect(data.estimates[14].amount).toBeGreaterThan(100_000_000);
        expect(data.notice.priceRangeLabel).toContain('%');
    });

    it('예가범위 시작/종료 퍼센트를 별도로 전달하면 실데이터 범위를 반영한다', () => {
        const data = buildMockBidStep1Data(
            {
                id: 'notice-range-1',
                title: '실데이터 범위 반영 테스트',
                organization: '조달청',
                basicAmount: 100_000_000,
            },
            {
                rangeBeginPercent: 2,
                rangeEndPercent: 3,
            }
        );

        expect(data.notice.priceRangeLabel).toBe('-2.0% ~ +3.0%');
        expect(data.estimates[0].ratioPercent).toBe(-2);
        expect(data.estimates[data.estimates.length - 1].ratioPercent).toBe(3);
    });

    it('예비가격 4개 선택 시 예정가격을 평균으로 계산한다', () => {
        const data = buildMockBidStep1Data({
            id: 'notice-2',
            title: '클라우드 운영 고도화',
            organization: '조달청',
            basicAmount: 200_000_000,
        });

        const selectedIndices = [0, 4, 10, 14];
        const plannedPrice = calculatePlannedPrice(data.estimates, selectedIndices);

        const expected = Math.floor(
            (data.estimates[0].amount +
                data.estimates[4].amount +
                data.estimates[10].amount +
                data.estimates[14].amount) / 4
        );

        expect(plannedPrice).toBe(expected);
    });

    it('선택 개수가 4개가 아니면 예정가격 계산 결과는 null이다', () => {
        const data = buildMockBidStep1Data({
            id: 'notice-3',
            title: '데이터 허브 구축',
            organization: '행정안전부',
            basicAmount: 150_000_000,
        });

        expect(calculatePlannedPrice(data.estimates, [0, 1, 2])).toBeNull();
    });

    it('예비가격 선택 토글은 중복 없이 최대 4개까지만 허용한다', () => {
        let selected = [0, 1, 2, 3];

        selected = toggleEstimateSelection(selected, 4, 4);
        expect(selected).toEqual([0, 1, 2, 3]);

        selected = toggleEstimateSelection(selected, 2, 4);
        expect(selected).toEqual([0, 1, 3]);

        selected = toggleEstimateSelection(selected, 4, 4);
        expect(selected).toEqual([0, 1, 3, 4]);
    });

    it('낙찰하한가는 기초금액×낙찰하한율로 계산하고 1원 단위 버림한다', () => {
        const lowerBidPrice = calculateLowerBidPrice(145_000_000, 87.745);
        expect(lowerBidPrice).toBe(127_230_250);
    });

    it('투찰금액은 기초금액×사정율×낙찰하한율로 계산하고 1원 단위 버림한다', () => {
        const bidAmount = calculateBidAmountByAdjustmentRate({
            basicAmount: 145_000_000,
            adjustmentRate: 98.123,
            lowerLimitRate: 87.745,
        });

        expect(bidAmount).toBe(124_842_138);
    });

    it('투찰율은 투찰금액/기초금액 비율을 반환한다', () => {
        const bidRate = calculateBidRateAgainstBasic(124_842_138, 145_000_000);
        expect(bidRate).toBeCloseTo(86.098, 3);
    });

    it('낙찰선에 근접한 투찰은 성공 결과와 높은 점수/XP를 반환한다', () => {
        const outcome = evaluateMockBidOutcome({
            basicAmount: 100_000_000,
            bidAmount: 87_950_000,
            lowerLimitRate: 87.745,
            plannedPrice: 88_000_000,
        });

        expect(outcome.resultType).toBe('success');
        expect(outcome.rank).toBeLessThanOrEqual(3);
        expect(outcome.score).toBeGreaterThanOrEqual(80);
        expect(outcome.xpGained).toBeGreaterThanOrEqual(35);
    });

    it('낙찰선에서 크게 벗어난 투찰은 실패 결과를 반환한다', () => {
        const outcome = evaluateMockBidOutcome({
            basicAmount: 100_000_000,
            bidAmount: 82_000_000,
            lowerLimitRate: 87.745,
            plannedPrice: 88_000_000,
        });

        expect(outcome.resultType).toBe('fail');
        expect(outcome.rank).toBeGreaterThan(3);
        expect(outcome.score).toBeLessThan(80);
    });

    it('사정율 입력이 비정상이면 최소값으로 보정해 투찰금액을 계산한다', () => {
        const bidAmount = calculateBidAmountByAdjustmentRate({
            basicAmount: 145_000_000,
            adjustmentRate: Number.NaN,
            lowerLimitRate: 87.745,
        });

        expect(bidAmount).toBe(111_638_182);
    });

    it('XP 산출은 최소 10, 최대 50 범위로 제한된다', () => {
        const highOutcome = evaluateMockBidOutcome({
            basicAmount: 90_000_000,
            bidAmount: 87_750_000,
            lowerLimitRate: 87.745,
            plannedPrice: 87_760_000,
        });

        const lowOutcome = evaluateMockBidOutcome({
            basicAmount: 300_000_000,
            bidAmount: 120_000_000,
            lowerLimitRate: 87.745,
            plannedPrice: 260_000_000,
        });

        expect(highOutcome.xpGained).toBeLessThanOrEqual(50);
        expect(lowOutcome.xpGained).toBeGreaterThanOrEqual(10);
    });
});
