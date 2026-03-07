import type { NoticeQualificationDetail } from '@/lib/bid/notice-detail-types';

interface NoticeQualificationCardProps {
    detail: NoticeQualificationDetail;
}

function renderJoined(values: string[]): string {
    return values.length > 0 ? values.join(', ') : '제한 없음';
}

function renderRegionValue(detail: NoticeQualificationDetail): string {
    if (detail.collectionStatus.regionStatus === 'collection_failed') {
        return '참가가능지역 정보를 불러오지 못했습니다.';
    }
    if (detail.regionRestriction.regionNames.length > 0) {
        return detail.regionRestriction.regionNames.join(', ');
    }
    if (detail.collectionStatus.regionStatus === 'source_unavailable') {
        return '원문 확인 필요';
    }
    return '제한 없음';
}

function renderLicenseSummary(detail: NoticeQualificationDetail): string {
    if (detail.collectionStatus.licenseStatus === 'collection_failed') {
        return '면허/업종 제한 정보를 불러오지 못했습니다.';
    }
    if (detail.licenseRestriction.items.length > 0) {
        return `${detail.licenseRestriction.items.length}건`;
    }
    if (detail.collectionStatus.licenseStatus === 'source_unavailable') {
        return '원문 확인 필요';
    }
    return '제한 없음';
}

function renderPerformanceValue(detail: NoticeQualificationDetail): string {
    if (!detail.performanceRequirement.isRequired) {
        return '제한 없음';
    }
    return detail.performanceRequirement.receiptMethodName ?? '원문 확인 필요';
}

function renderJointContractValue(detail: NoticeQualificationDetail): string {
    if (!detail.jointContractRequirement.isRegionalDutyRequired) {
        return '제한 없음';
    }
    return detail.jointContractRequirement.dutyRate !== null
        ? `${detail.jointContractRequirement.dutyRate}%`
        : '원문 확인 필요';
}

function SectionRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
        </div>
    );
}

export function NoticeQualificationCard({ detail }: NoticeQualificationCardProps) {
    return (
        <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">지역제한</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <SectionRow label="참가가능지역" value={renderRegionValue(detail)} />
                    <SectionRow
                        label="소재지 판단기준"
                        value={detail.regionRestriction.judgementBasisName ?? '제한 없음'}
                    />
                </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">면허/업종 제한</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <SectionRow label="제한 건수" value={renderLicenseSummary(detail)} />
                    <SectionRow
                        label="대표 면허"
                        value={detail.licenseRestriction.items[0]?.licenseName ?? '제한 없음'}
                    />
                </div>
                {detail.licenseRestriction.items.length > 0 ? (
                    <div className="mt-4 space-y-3">
                        {detail.licenseRestriction.items.map((item) => (
                            <div
                                key={`${item.groupNo ?? 'na'}-${item.sequenceNo ?? 'na'}-${item.licenseName}`}
                                className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60"
                            >
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {item.licenseName}
                                </p>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <SectionRow
                                        label="허용업종"
                                        value={renderJoined(item.permittedIndustries)}
                                    />
                                    <SectionRow label="주력분야" value={renderJoined(item.majorFields)} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">실적 요건</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <SectionRow label="실적요건" value={renderPerformanceValue(detail)} />
                    <SectionRow
                        label="접수일시"
                        value={detail.performanceRequirement.receiptDateLabel ?? '제한 없음'}
                    />
                </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">공동도급/지역의무</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <SectionRow label="의무비율" value={renderJointContractValue(detail)} />
                    <SectionRow
                        label="의무지역"
                        value={renderJoined(detail.jointContractRequirement.dutyRegions)}
                    />
                </div>
            </section>
        </div>
    );
}
