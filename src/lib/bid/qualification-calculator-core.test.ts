import {
    calculateQualificationResult,
    createDefaultRuleConfig,
    DEFAULT_SIGNAL_FLAGS,
} from './qualification-calculator-core';
import type { QualificationCalculationInput } from './qualification-calculator-types';

function makeInput(overrides: Partial<QualificationCalculationInput> = {}): QualificationCalculationInput {
    return {
        category: 'construction',
        customLowerLimit: 87.745,
        baseAmount: 500000000,
        aValue: 15000000,
        performanceAmount: 700000000,
        creditRatingScore: 19.0,
        techScore: 0,
        disqualificationScore: 0,
        signalFlags: { ...DEFAULT_SIGNAL_FLAGS },
        selectedRuleConfig: createDefaultRuleConfig('construction'),
        ...overrides,
    };
}

describe('calculateQualificationResult', () => {
    it('같은 입력이면 항상 동일한 결과를 반환한다', () => {
        const input = makeInput({
            signalFlags: {
                womanEnterprise: true,
                disabledEnterprise: false,
                socialEnterprise: true,
                jobCreation: false,
                smallEnterprise: true,
            },
            disqualificationScore: 1.5,
        });

        const first = calculateQualificationResult(input);
        const second = calculateQualificationResult(input);
        const third = calculateQualificationResult(input);

        expect(second).toEqual(first);
        expect(third).toEqual(first);
    });

    it('계산된 투찰률이 하한율보다 낮으면 하한율로 보정한다', () => {
        const input = makeInput({
            creditRatingScore: 25,
            performanceAmount: 1200000000,
            customLowerLimit: 89.745,
        });

        const result = calculateQualificationResult(input);

        expect(result.finalBidRate).toBeGreaterThanOrEqual(89.745);
        expect(result.effectiveLowerLimit).toBe(89.745);
    });

    it('필요 가격점수가 배점을 초과하면 입찰 불가 상태가 된다', () => {
        const input = makeInput({
            performanceAmount: 0,
            creditRatingScore: 15,
            disqualificationScore: 8,
        });

        const result = calculateQualificationResult(input);

        expect(result.status).toBe('error');
        expect(result.message.startsWith('❌')).toBe(true);
    });
});
