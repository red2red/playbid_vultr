import type {
    NoticeQualificationCollectionStatus,
    NoticeQualificationDetail,
    NoticeQualificationLicenseItem,
} from './notice-detail-types';

const qualificationDateFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    // Service-facing qualification timestamps are displayed in KST regardless of runner/host locale.
    timeZone: 'Asia/Seoul',
});

type QualificationBuildParams = {
    noticeRow: Record<string, unknown>;
    regionRows: Array<Record<string, unknown>>;
    licenseRows: Array<Record<string, unknown>>;
    statusRow?: Record<string, unknown> | null;
};

function asString(value: unknown): string | null {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
}

function asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/,/g, '').trim());
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((entry) => asString(entry))
            .filter((entry): entry is string => entry !== null);
    }
    const single = asString(value);
    return single ? [single] : [];
}

function uniqueStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.length > 0))];
}

function formatQualificationDate(value: unknown): string | null {
    const text = asString(value);
    if (!text) {
        return null;
    }
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
        return text;
    }
    return qualificationDateFormatter.format(date).replace(/\./g, '.').replace(/\s/g, ' ').trim();
}

function normalizeStatus(value: unknown): NoticeQualificationCollectionStatus | null {
    const text = asString(value);
    if (
        text === 'collected' ||
        text === 'not_applicable' ||
        text === 'source_unavailable' ||
        text === 'collection_failed'
    ) {
        return text;
    }
    return null;
}

function toLicenseItems(rows: Array<Record<string, unknown>>): NoticeQualificationLicenseItem[] {
    return rows
        .map((row) => {
            const licenseName = asString(row.license_name);
            if (!licenseName) {
                return null;
            }
            return {
                groupNo: asNumber(row.lmt_grp_no),
                sequenceNo: asNumber(row.lmt_sno),
                licenseName,
                permittedIndustries: asStringArray(row.permitted_industries),
                majorFields: asStringArray(row.major_fields),
                businessDivisionName: asString(row.business_division_name),
            };
        })
        .filter((row): row is NoticeQualificationLicenseItem => row !== null);
}

export function buildQualificationDetail({
    noticeRow,
    regionRows,
    licenseRows,
    statusRow,
}: QualificationBuildParams): NoticeQualificationDetail {
    const regionNames = uniqueStrings(
        regionRows
            .map((row) => asString(row.region_name))
            .filter((row): row is string => row !== null)
    );
    const licenseItems = toLicenseItems(licenseRows);
    const dutyRegions = uniqueStrings(asStringArray(noticeRow.jntcontrct_duty_rgn_nms));
    const regionStatus = normalizeStatus(statusRow?.region_status);
    const licenseStatus = normalizeStatus(statusRow?.license_status);
    const isRegionRestricted =
        regionNames.length > 0 ||
        (asString(noticeRow.prtcpt_lmt_rgn_nm) !== null && asString(noticeRow.prtcpt_lmt_rgn_nm) !== '전국');
    const hasLicenseRestriction =
        licenseItems.length > 0 || asString(noticeRow.indstryty_lmt_yn)?.toUpperCase() === 'Y';
    const isPerformanceRequired =
        asString(noticeRow.arslt_cmpt_yn)?.toUpperCase() === 'Y' ||
        formatQualificationDate(noticeRow.arslt_appl_doc_rcpt_dt) !== null;
    const isJointRegionalDuty = asString(noticeRow.rgn_duty_jntcontrct_yn)?.toUpperCase() === 'Y';

    return {
        regionRestriction: {
            isRestricted: isRegionRestricted,
            regionNames,
            judgementBasisName: asString(noticeRow.rgn_lmt_bid_locplc_jdgm_bss_nm),
        },
        licenseRestriction: {
            isRestricted: hasLicenseRestriction,
            items: licenseItems,
        },
        performanceRequirement: {
            isRequired: isPerformanceRequired,
            receiptMethodName: asString(noticeRow.arslt_appl_doc_rcpt_mthd_nm),
            receiptDateLabel: formatQualificationDate(noticeRow.arslt_appl_doc_rcpt_dt),
        },
        jointContractRequirement: {
            isRegionalDutyRequired: isJointRegionalDuty,
            dutyRate: asNumber(noticeRow.rgn_duty_jntcontrct_rt),
            dutyRegions,
        },
        collectionStatus: {
            regionStatus,
            licenseStatus,
        },
    };
}

export function buildQualificationSummary(detail: NoticeQualificationDetail): string {
    if (
        detail.collectionStatus.regionStatus === 'collection_failed' ||
        detail.collectionStatus.licenseStatus === 'collection_failed'
    ) {
        return '일부 정보 미수집';
    }

    const summaryParts: string[] = [];
    if (detail.regionRestriction.regionNames.length > 0) {
        summaryParts.push(`지역제한(${detail.regionRestriction.regionNames.join(', ')})`);
    }
    if (detail.licenseRestriction.isRestricted) {
        summaryParts.push('면허/업종 제한');
    }
    if (detail.performanceRequirement.isRequired) {
        summaryParts.push('실적요건');
    }
    if (detail.jointContractRequirement.isRegionalDutyRequired) {
        summaryParts.push('지역의무공동도급');
    }

    if (summaryParts.length > 0) {
        return summaryParts.join(', ');
    }

    if (
        detail.collectionStatus.regionStatus === 'not_applicable' &&
        detail.collectionStatus.licenseStatus === 'not_applicable'
    ) {
        return '제한 없음';
    }

    return '일부 정보 미수집';
}
