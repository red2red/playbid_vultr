import { render, screen } from '@testing-library/react';
import { NoticeQualificationCard } from '../notice-qualification-card';
import type { NoticeQualificationDetail } from '@/lib/bid/notice-detail-types';

const qualificationDetail: NoticeQualificationDetail = {
    regionRestriction: {
        isRestricted: true,
        regionNames: ['강원특별자치도', '경기도'],
        judgementBasisName: '본사또는참여지사소재지',
    },
    licenseRestriction: {
        isRestricted: true,
        items: [
            {
                groupNo: 1,
                sequenceNo: 2,
                licenseName: '정보통신공사업',
                permittedIndustries: ['소프트웨어사업자'],
                majorFields: ['1^응용소프트웨어'],
                businessDivisionName: '용역',
            },
        ],
    },
    performanceRequirement: {
        isRequired: true,
        receiptMethodName: '직접제출',
        receiptDateLabel: '2025. 07. 03. 00:30',
    },
    jointContractRequirement: {
        isRegionalDutyRequired: true,
        dutyRate: 49,
        dutyRegions: ['강원특별자치도'],
    },
    collectionStatus: {
        regionStatus: 'collected',
        licenseStatus: 'collected',
    },
};

describe('NoticeQualificationCard', () => {
    it('참가자격 상세 섹션을 구조화해 렌더링한다', () => {
        render(<NoticeQualificationCard detail={qualificationDetail} />);

        expect(screen.getByText('지역제한')).toBeInTheDocument();
        expect(screen.getByText('강원특별자치도, 경기도')).toBeInTheDocument();
        expect(screen.getByText('본사또는참여지사소재지')).toBeInTheDocument();
        expect(screen.getAllByText('정보통신공사업').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('소프트웨어사업자')).toBeInTheDocument();
        expect(screen.getByText('직접제출')).toBeInTheDocument();
        expect(screen.getByText('2025. 07. 03. 00:30')).toBeInTheDocument();
        expect(screen.getByText('49%')).toBeInTheDocument();
    });

    it('제한 없음과 원문 확인 필요를 구분한다', () => {
        render(
            <NoticeQualificationCard
                detail={{
                    ...qualificationDetail,
                    regionRestriction: {
                        isRestricted: false,
                        regionNames: [],
                        judgementBasisName: null,
                    },
                    licenseRestriction: {
                        isRestricted: false,
                        items: [],
                    },
                    performanceRequirement: {
                        isRequired: false,
                        receiptMethodName: null,
                        receiptDateLabel: null,
                    },
                    jointContractRequirement: {
                        isRegionalDutyRequired: false,
                        dutyRate: null,
                        dutyRegions: [],
                    },
                    collectionStatus: {
                        regionStatus: 'source_unavailable',
                        licenseStatus: 'not_applicable',
                    },
                }}
            />
        );

        expect(screen.getByText('원문 확인 필요')).toBeInTheDocument();
        expect(screen.getAllByText('제한 없음').length).toBeGreaterThanOrEqual(2);
    });
});
