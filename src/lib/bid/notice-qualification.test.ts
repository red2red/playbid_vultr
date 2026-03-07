import { buildQualificationDetail, buildQualificationSummary } from './notice-qualification';

describe('notice-qualification', () => {
    it('지역/면허/실적/공동도급 정보를 구조화한다', () => {
        const detail = buildQualificationDetail({
            noticeRow: {
                prtcpt_lmt_rgn_nm: '강원특별자치도',
                rgn_lmt_bid_locplc_jdgm_bss_nm: '본사또는참여지사소재지',
                indstryty_lmt_yn: 'Y',
                arslt_cmpt_yn: 'Y',
                arslt_appl_doc_rcpt_mthd_nm: '직접제출',
                arslt_appl_doc_rcpt_dt: '2025-07-02T15:30:00Z',
                rgn_duty_jntcontrct_yn: 'Y',
                rgn_duty_jntcontrct_rt: 49,
                jntcontrct_duty_rgn_nms: ['강원특별자치도'],
            },
            regionRows: [{ region_name: '강원특별자치도' }, { region_name: '경기도' }],
            licenseRows: [
                {
                    lmt_grp_no: 1,
                    lmt_sno: 2,
                    license_name: '정보통신공사업',
                    permitted_industries: ['소프트웨어사업자'],
                    major_fields: ['1^응용소프트웨어'],
                    business_division_name: '용역',
                },
            ],
            statusRow: { region_status: 'collected', license_status: 'collected' },
        });

        expect(detail.regionRestriction).toEqual({
            isRestricted: true,
            regionNames: ['강원특별자치도', '경기도'],
            judgementBasisName: '본사또는참여지사소재지',
        });
        expect(detail.licenseRestriction.isRestricted).toBe(true);
        expect(detail.licenseRestriction.items).toHaveLength(1);
        expect(detail.performanceRequirement).toEqual({
            isRequired: true,
            receiptMethodName: '직접제출',
            receiptDateLabel: '2025. 07. 03. 00:30',
        });
        expect(detail.jointContractRequirement).toEqual({
            isRegionalDutyRequired: true,
            dutyRate: 49,
            dutyRegions: ['강원특별자치도'],
        });
        expect(detail.collectionStatus).toEqual({
            regionStatus: 'collected',
            licenseStatus: 'collected',
        });
    });

    it('제한 없음과 미수집을 구분한 요약을 만든다', () => {
        const noRestrictionDetail = buildQualificationDetail({
            noticeRow: {
                indstryty_lmt_yn: 'N',
                arslt_cmpt_yn: 'N',
                rgn_duty_jntcontrct_yn: 'N',
                jntcontrct_duty_rgn_nms: [],
            },
            regionRows: [],
            licenseRows: [],
            statusRow: { region_status: 'not_applicable', license_status: 'not_applicable' },
        });
        const partialDetail = buildQualificationDetail({
            noticeRow: {
                indstryty_lmt_yn: 'Y',
                arslt_cmpt_yn: 'N',
                rgn_duty_jntcontrct_yn: 'N',
                jntcontrct_duty_rgn_nms: [],
            },
            regionRows: [],
            licenseRows: [],
            statusRow: { region_status: 'source_unavailable', license_status: 'collection_failed' },
        });

        expect(buildQualificationSummary(noRestrictionDetail)).toBe('제한 없음');
        expect(buildQualificationSummary(partialDetail)).toBe('일부 정보 미수집');
    });
});
