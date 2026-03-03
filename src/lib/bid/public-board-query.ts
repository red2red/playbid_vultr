import { createClient } from '@/lib/supabase/server';
import { getCategoryLabel } from './category-normalize';

export interface PublicNoticeItem {
    id: string;
    title: string;
    organization: string;
    estimatedPrice: number | null;
    deadlineAtIso: string;
    isClosingSoon: boolean;
    isClosed: boolean;
    type: 'notice';
}

export interface PublicResultItem {
    id: string;
    bidNoticeId?: string;
    bidNoticeNo: string;
    title: string;
    organization: string;
    estimatedPrice: number | null;
    openingDateIso: string;
    type: 'result';
}

const moneyFormatter = new Intl.NumberFormat('ko-KR');

type PublicNoticeRow = {
    id: string;
    bid_ntce_nm: string | null;
    ntce_instt_nm: string | null;
    presmpt_prce: number | null;
    bdgt_amt: number | null;
    bid_clse_dt: string;
};

type PublicResultRow = {
    id: string;
    bid_notice_id: string | null;
    bid_ntce_no: string;
    bid_ntce_nm: string | null;
    ntce_instt_nm: string | null;
    presmpt_prce: number | null;
    openg_dt: string;
};

function formatMoney(value: number | null): string {
    if (value === null) return '금액 미정';
    return `${moneyFormatter.format(Math.round(value))}원`;
}

export async function getPublicNotices(limit = 5): Promise<PublicNoticeItem[]> {
    try {
        const supabase = await createClient();
        const now = new Date();

        const { data, error } = await supabase
            .from('bid_notices')
            .select('id, bid_ntce_nm, ntce_instt_nm, presmpt_prce, bdgt_amt, bid_clse_dt')
            .gte('bid_clse_dt', now.toISOString()) // Only open or closing soon
            .order('bid_clse_dt', { ascending: true }) // Soonest first
            .limit(limit);

        if (error || !data) return [];

        return (data as PublicNoticeRow[]).map((row) => {
            const estimatedPrice = Number(row.presmpt_prce) > 0 ? Number(row.presmpt_prce) : Number(row.bdgt_amt);

            const deadline = new Date(row.bid_clse_dt);
            const remainingMs = deadline.getTime() - now.getTime();
            const isClosingSoon = remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000;
            const isClosed = remainingMs <= 0;

            return {
                id: row.id,
                title: row.bid_ntce_nm || '공고명 미확인',
                organization: row.ntce_instt_nm || '기관 정보 없음',
                estimatedPrice: isNaN(estimatedPrice) || estimatedPrice <= 0 ? null : estimatedPrice,
                deadlineAtIso: row.bid_clse_dt,
                isClosingSoon,
                isClosed,
                type: 'notice'
            };
        });
    } catch {
        return [];
    }
}

export async function getPublicResults(limit = 5): Promise<PublicResultItem[]> {
    try {
        const supabase = await createClient();

        // fetch latest opening results
        const { data, error } = await supabase
            .from('bid_results')
            .select('id, bid_notice_id, bid_ntce_no, bid_ntce_nm, ntce_instt_nm, presmpt_prce, openg_dt')
            .order('openg_dt', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return (data as PublicResultRow[]).map((row) => {
            const estimatedPrice = Number(row.presmpt_prce);
            return {
                id: row.id,
                bidNoticeId: row.bid_notice_id ?? undefined,
                bidNoticeNo: row.bid_ntce_no,
                title: row.bid_ntce_nm || '결과명 미확인',
                organization: row.ntce_instt_nm || '기관 정보 없음',
                estimatedPrice: isNaN(estimatedPrice) || estimatedPrice <= 0 ? null : estimatedPrice,
                openingDateIso: row.openg_dt,
                type: 'result'
            };
        });
    } catch {
        return [];
    }
}
