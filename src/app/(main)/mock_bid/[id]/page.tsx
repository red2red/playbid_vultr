import { MockBidPage } from '@/components/mock-bid/mock-bid-page';
import { buildMockBidStep1Data } from '@/lib/bid/mock-bid-service';
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
    const fallbackBasicAmount = notice.estimatedPrice > 0 ? notice.estimatedPrice : notice.budget;
    const basicAmountRange = await getMockBidBasicAmountRange(notice.noticeNumber, notice.noticeOrder);
    const basicAmount = basicAmountRange?.basicAmount && basicAmountRange.basicAmount > 0
        ? Math.floor(basicAmountRange.basicAmount)
        : fallbackBasicAmount;

    const step1Data = buildMockBidStep1Data(
        {
            id: notice.id,
            noticeNumber: notice.noticeNumber,
            title: notice.title,
            organization: notice.organization,
            basicAmount,
        },
        {
            rangeBeginPercent: basicAmountRange?.rangeBeginPercent,
            rangeEndPercent: basicAmountRange?.rangeEndPercent,
        }
    );

    return <MockBidPage data={step1Data} />;
}
