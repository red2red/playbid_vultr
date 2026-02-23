import { createClient } from '@/lib/supabase/server';
import { getBookmarkStateForCurrentUser } from './bookmark-service';
import {
    getCategoryQueryValues,
    getDisplayCategory,
    normalizeCategory,
} from './category-normalize';
import type {
    NoticeAttachment,
    NoticeDetail,
    NoticeDetailPageData,
    NoticeErrorPayload,
    NoticeStatus,
    PremiumPreviewStats,
    SimilarNotice,
} from './notice-detail-types';

const DEFAULT_NOTICE_ID = 'notice-sample';

const NOTICE_SELECT = `
  id,
  bid_ntce_no,
  bid_ntce_ord,
  bid_ntce_nm,
  ntce_instt_nm,
  dminstt_nm,
  api_category,
  bid_ntce_dt,
  bid_clse_dt,
  openg_dt,
  presmpt_prce,
  cntrct_cncls_mthd_nm,
  bid_methd_nm
`;
const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});
const currencyFormatter = new Intl.NumberFormat('ko-KR');

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function makeRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return dateTimeFormatter.format(parsed).replace(/\./g, '.').replace(/\s/g, ' ').trim();
}

function inferStatus(deadlineAt: string): NoticeStatus {
    const now = Date.now();
    const deadline = new Date(deadlineAt).getTime();

    if (Number.isNaN(deadline) || deadline <= now) {
        return 'closed';
    }

    const remaining = deadline - now;
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (remaining <= oneDayMs) {
        return 'closing_soon';
    }

    return 'open';
}

function formatCurrency(value: number): string {
    return currencyFormatter.format(value);
}

function createMockNotice(id: string): NoticeDetail {
    const normalizedId = id || DEFAULT_NOTICE_ID;
    const bidStart = new Date();
    bidStart.setDate(bidStart.getDate() - 2);
    const bidDeadline = new Date();
    bidDeadline.setDate(bidDeadline.getDate() + 5);
    const opening = new Date();
    opening.setDate(opening.getDate() + 6);

    return {
        id: normalizedId,
        noticeNumber: normalizedId,
        noticeOrder: '001',
        title: '전자정부프레임워크 유지보수 용역',
        organization: '조달청 디지털서비스국',
        demander: '행정안전부',
        displayCategory: 'product',
        queryCategory: 'goods',
        status: inferStatus(bidDeadline.toISOString()),
        publishedAt: formatDateTime(new Date().toISOString()),
        publishedAtIso: new Date().toISOString(),
        bidStartAt: formatDateTime(bidStart.toISOString()),
        bidStartAtIso: bidStart.toISOString(),
        bidDeadlineAt: formatDateTime(bidDeadline.toISOString()),
        bidDeadlineAtIso: bidDeadline.toISOString(),
        openingAt: formatDateTime(opening.toISOString()),
        openingAtIso: opening.toISOString(),
        budget: 150000000,
        estimatedPrice: 145000000,
        bidMethod: '일반경쟁입찰',
        contractMethod: '총액계약',
        qualificationSummary: '중소기업 및 소프트웨어사업자 신고 업체',
        views: 1234,
        sourceUrl: 'https://www.g2b.go.kr',
        qualificationRequired: true,
        timeline: [
            {
                key: 'published',
                label: '공고게시',
                dateTime: formatDateTime(new Date().toISOString()),
                status: 'completed',
            },
            {
                key: 'start',
                label: '입찰시작',
                dateTime: formatDateTime(bidStart.toISOString()),
                status: 'current',
            },
            {
                key: 'deadline',
                label: '입찰마감',
                dateTime: formatDateTime(bidDeadline.toISOString()),
                status: 'upcoming',
            },
            {
                key: 'opening',
                label: '개찰',
                dateTime: formatDateTime(opening.toISOString()),
                status: 'upcoming',
            },
        ],
        detailSections: {
            overview:
                '정부 디지털 전환 사업의 안정적 운영을 위한 유지보수 용역입니다. 장애 대응, 정기 점검, 성능 튜닝이 포함됩니다.',
            qualification:
                '중소기업 확인서 보유 업체, 소프트웨어사업자 신고 완료 업체에 한해 참가 가능합니다.',
            documents:
                '제안요청서, 과업지시서, 사업수행계획서, 실적증명서, 가격입찰서가 필요합니다.',
            etc: '현장설명회는 별도 진행하지 않으며, 질의응답은 전자문서로 접수합니다.',
        },
    };
}

function createMockAttachments(noticeId: string): NoticeAttachment[] {
    return [
        {
            id: `${noticeId}-a1`,
            name: '제안요청서.pdf',
            sizeLabel: '2.1MB',
            url: '#',
        },
        {
            id: `${noticeId}-a2`,
            name: '과업지시서.hwp',
            sizeLabel: '1.3MB',
            url: '#',
        },
        {
            id: `${noticeId}-a3`,
            name: '계약특수조건.docx',
            sizeLabel: '0.8MB',
            url: '#',
        },
    ];
}

function createMockSimilarNotices(noticeId: string): SimilarNotice[] {
    return [
        {
            id: `${noticeId}-s1`,
            noticeNumber: '20260223-101',
            title: '정보시스템 운영 지원 용역',
            organization: '행정안전부',
            budgetLabel: `${formatCurrency(180000000)}원`,
            deadlineAt: formatDateTime(new Date(Date.now() + 4 * 86400000).toISOString()),
            status: 'open',
            category: 'goods',
        },
        {
            id: `${noticeId}-s2`,
            noticeNumber: '20260223-102',
            title: '클라우드 인프라 유지관리',
            organization: '조달청',
            budgetLabel: `${formatCurrency(120000000)}원`,
            deadlineAt: formatDateTime(new Date(Date.now() + 2 * 86400000).toISOString()),
            status: 'closing_soon',
            category: 'goods',
        },
        {
            id: `${noticeId}-s3`,
            noticeNumber: '20260223-103',
            title: '공공데이터 포털 기능 개선',
            organization: '과학기술정보통신부',
            budgetLabel: `${formatCurrency(210000000)}원`,
            deadlineAt: formatDateTime(new Date(Date.now() + 8 * 86400000).toISOString()),
            status: 'open',
            category: 'service',
        },
    ];
}

function createMockPremiumPreview(): PremiumPreviewStats {
    return {
        averageParticipants: 8.5,
        averageSuccessRate: 87.3,
        similarRateTrend: [86.2, 86.7, 87.1, 87.3, 87.0],
        isLocked: true,
    };
}

function mapNoticeRow(row: Record<string, unknown>, id: string): NoticeDetail {
    const bidDeadlineRaw = String(row.bid_clse_dt ?? new Date().toISOString());
    const bidStartRaw = String(row.bid_ntce_dt ?? new Date().toISOString());
    const openingRaw = String(row.openg_dt ?? new Date().toISOString());

    const displayCategory = getDisplayCategory(String(row.api_category ?? 'unknown'));
    const queryCategory = normalizeCategory(String(row.api_category ?? 'unknown'));

    return {
        id: String(row.id ?? id),
        noticeNumber: String(row.bid_ntce_no ?? id),
        noticeOrder: row.bid_ntce_ord ? String(row.bid_ntce_ord) : undefined,
        title: String(row.bid_ntce_nm ?? '공고 제목 없음'),
        organization: String(row.ntce_instt_nm ?? '기관 정보 없음'),
        demander: row.dminstt_nm ? String(row.dminstt_nm) : undefined,
        displayCategory,
        queryCategory,
        status: inferStatus(bidDeadlineRaw),
        publishedAt: formatDateTime(String(row.bid_ntce_dt ?? new Date().toISOString())),
        publishedAtIso: String(row.bid_ntce_dt ?? new Date().toISOString()),
        bidStartAt: formatDateTime(bidStartRaw),
        bidStartAtIso: bidStartRaw,
        bidDeadlineAt: formatDateTime(bidDeadlineRaw),
        bidDeadlineAtIso: bidDeadlineRaw,
        openingAt: formatDateTime(openingRaw),
        openingAtIso: openingRaw,
        budget: Number(row.presmpt_prce ?? 0),
        estimatedPrice: Number(row.presmpt_prce ?? 0),
        bidMethod: String(row.bid_methd_nm ?? '일반경쟁입찰'),
        contractMethod: String(row.cntrct_cncls_mthd_nm ?? '총액계약'),
        qualificationSummary: '중소기업 및 소프트웨어사업자 신고 업체',
        views: 0,
        sourceUrl: 'https://www.g2b.go.kr',
        qualificationRequired: true,
        timeline: [
            {
                key: 'published',
                label: '공고게시',
                dateTime: formatDateTime(String(row.bid_ntce_dt ?? new Date().toISOString())),
                status: 'completed',
            },
            {
                key: 'start',
                label: '입찰시작',
                dateTime: formatDateTime(bidStartRaw),
                status: 'current',
            },
            {
                key: 'deadline',
                label: '입찰마감',
                dateTime: formatDateTime(bidDeadlineRaw),
                status: 'upcoming',
            },
            {
                key: 'opening',
                label: '개찰',
                dateTime: formatDateTime(openingRaw),
                status: 'upcoming',
            },
        ],
        detailSections: {
            overview: '공고 상세 내용이 아직 동기화되지 않았습니다.',
            qualification: '참가자격 항목을 원문에서 확인해 주세요.',
            documents: '제출서류 목록을 확인 중입니다.',
            etc: '추가 안내사항이 없습니다.',
        },
    };
}

function createErrorPayload(code: string, message: string, suggestion: string): NoticeErrorPayload {
    return {
        requestId: makeRequestId(),
        code,
        message,
        suggestion,
    };
}

export async function getNoticeDetailById(id: string): Promise<NoticeDetail> {
    const fallback = createMockNotice(id);

    try {
        const supabase = await createClient();

        const query = supabase.from('bid_notices').select(NOTICE_SELECT).limit(1);

        const { data, error } = isUuid(id)
            ? await query.eq('id', id)
            : await query.eq('bid_ntce_no', id);

        if (error || !data || data.length === 0) {
            return fallback;
        }

        return mapNoticeRow(data[0] as Record<string, unknown>, id);
    } catch {
        return fallback;
    }
}

export async function getNoticeAttachments(noticeId: string): Promise<NoticeAttachment[]> {
    // 운영 스키마에 첨부파일 테이블이 없을 수 있으므로 안전하게 mock fallback을 사용한다.
    return createMockAttachments(noticeId);
}

export async function getSimilarNotices(
    noticeId: string,
    queryCategory: string
): Promise<SimilarNotice[]> {
    const fallback = createMockSimilarNotices(noticeId);

    try {
        const supabase = await createClient();
        const categories = getCategoryQueryValues(queryCategory);

        const { data, error } = await supabase
            .from('bid_notices')
            .select('id,bid_ntce_no,bid_ntce_nm,ntce_instt_nm,presmpt_prce,bid_clse_dt,api_category')
            .in('api_category', categories)
            .limit(3);

        if (error || !data || data.length === 0) {
            return fallback;
        }

        return (data as Record<string, unknown>[]).map((row, index) => ({
            id: String(row.id ?? `${noticeId}-s${index + 1}`),
            noticeNumber: String(row.bid_ntce_no ?? `${noticeId}-s${index + 1}`),
            title: String(row.bid_ntce_nm ?? '유사 공고'),
            organization: String(row.ntce_instt_nm ?? '기관 정보 없음'),
            budgetLabel: `${formatCurrency(Number(row.presmpt_prce ?? 0))}원`,
            deadlineAt: formatDateTime(String(row.bid_clse_dt ?? new Date().toISOString())),
            status: inferStatus(String(row.bid_clse_dt ?? new Date().toISOString())),
            category: normalizeCategory(String(row.api_category ?? 'unknown')),
        }));
    } catch {
        return fallback;
    }
}

export async function getPremiumPreviewStats(): Promise<PremiumPreviewStats> {
    return createMockPremiumPreview();
}

export async function getNoticeDetailPageData(id: string): Promise<NoticeDetailPageData> {
    // This query is independent from notice lookup, so start it early to avoid avoidable delay.
    const premiumPreviewPromise = getPremiumPreviewStats();
    const baseNotice = await getNoticeDetailById(id);

    try {
        const [attachments, similarNotices, premiumPreview, isBookmarked] = await Promise.all([
            getNoticeAttachments(baseNotice.id),
            getSimilarNotices(baseNotice.id, baseNotice.queryCategory),
            premiumPreviewPromise,
            getBookmarkStateForCurrentUser(baseNotice.id, baseNotice.noticeNumber),
        ]);

        return {
            notice: baseNotice,
            attachments,
            similarNotices,
            premiumPreview,
            isBookmarked,
        };
    } catch {
        return {
            notice: baseNotice,
            attachments: createMockAttachments(baseNotice.id),
            similarNotices: createMockSimilarNotices(baseNotice.id),
            premiumPreview: createMockPremiumPreview(),
            isBookmarked: false,
            error: createErrorPayload(
                'NOTICE_DETAIL_DATA_FAILED',
                '상세 데이터를 완전히 불러오지 못했습니다.',
                '잠시 후 다시 시도하거나 원문 링크를 통해 확인해 주세요.'
            ),
        };
    }
}
