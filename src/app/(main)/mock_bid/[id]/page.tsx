import Link from 'next/link';
import { MockBidPage } from '@/components/mock-bid/mock-bid-page';
import { buildOfficialMockBidStep1Data } from '@/lib/bid/mock-bid-service';
import { getNoticeDetailById } from '@/lib/bid/notice-detail-query';
import { createClient } from '@/lib/supabase/server';

type PageParams = { id: string };

interface MockBidRoutePageProps {
    params: PageParams | Promise<PageParams>;
}

interface MockBidBasicAmountRange {
    basicAmount?: number;
    rangeBeginPercent?: number;
    rangeEndPercent?: number;
}

function hasOfficialMockBidData(args: {
    lowerLimitRate: number | null | undefined;
    basicAmountRange: MockBidBasicAmountRange | null;
}): boolean {
    return (
        Number.isFinite(args.lowerLimitRate) &&
        (args.lowerLimitRate ?? 0) > 0 &&
        !!args.basicAmountRange &&
        (args.basicAmountRange.basicAmount ?? 0) > 0 &&
        args.basicAmountRange.rangeBeginPercent !== undefined &&
        args.basicAmountRange.rangeEndPercent !== undefined
    );
}

function MockBidUnavailableState({ noticeId }: { noticeId: string }) {
    return (
        <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8 dark:bg-[#0B1121]">
            <div className="mx-auto flex max-w-2xl justify-center">
                <section className="w-full rounded-2xl border border-amber-200 bg-white p-6 shadow-sm dark:border-amber-900/50 dark:bg-[#151E32]">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        모의입찰을 진행할 수 없습니다.
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                        공식 예가범위 정보가 없어 이 공고는 모의입찰을 제공하지 않습니다.
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        공식 기초금액과 예가범위가 확인된 공고만 모의입찰을 지원합니다. 원문이나 상세 정보를 다시
                        확인한 뒤 이용해 주세요.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                            href={`/bid_notice/detail/${encodeURIComponent(noticeId)}`}
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400"
                        >
                            공고 상세로 돌아가기
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}

function asFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/,/g, '').trim();
        if (!normalized) {
            return undefined;
        }
        const parsed = Number(normalized);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

function normalizeRangePercent(value: unknown): number | undefined {
    const parsed = asFiniteNumber(value);
    if (parsed === undefined) {
        return undefined;
    }
    return Math.max(0.1, Math.abs(parsed));
}

async function getMockBidBasicAmountRange(
    noticeNumber: string,
    noticeOrder?: string
): Promise<MockBidBasicAmountRange | null> {
    try {
        const supabase = await createClient();
        const order = noticeOrder && noticeOrder.trim().length > 0 ? noticeOrder : '000';
        const { data, error } = await supabase
            .from('bid_basic_amounts')
            .select('bssamt, rsrvtn_prce_rng_bgn_rate, rsrvtn_prce_rng_end_rate')
            .eq('bid_ntce_no', noticeNumber)
            .eq('bid_ntce_ord', order)
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return {
            basicAmount: asFiniteNumber((data as Record<string, unknown>).bssamt),
            rangeBeginPercent: normalizeRangePercent(
                (data as Record<string, unknown>).rsrvtn_prce_rng_bgn_rate
            ),
            rangeEndPercent: normalizeRangePercent(
                (data as Record<string, unknown>).rsrvtn_prce_rng_end_rate
            ),
        };
    } catch {
        return null;
    }
}

export default async function MockBidRoutePage({ params }: MockBidRoutePageProps) {
    const resolvedParams = await params;
    const noticeId = resolvedParams.id;

    const notice = await getNoticeDetailById(noticeId);
    const basicAmountRange = await getMockBidBasicAmountRange(notice.noticeNumber, notice.noticeOrder);

    if (
        !hasOfficialMockBidData({
            lowerLimitRate: notice.lowerLimitRate,
            basicAmountRange,
        })
    ) {
        return <MockBidUnavailableState noticeId={noticeId} />;
    }

    const step1Data = buildOfficialMockBidStep1Data(
        {
            id: notice.id,
            noticeNumber: notice.noticeNumber,
            title: notice.title,
            organization: notice.organization,
            basicAmount: Math.floor(basicAmountRange!.basicAmount!),
            lowerLimitRate: notice.lowerLimitRate ?? undefined,
        },
        {
            rangeBeginPercent: basicAmountRange!.rangeBeginPercent,
            rangeEndPercent: basicAmountRange!.rangeEndPercent,
        }
    );

    return <MockBidPage data={step1Data} />;
}
