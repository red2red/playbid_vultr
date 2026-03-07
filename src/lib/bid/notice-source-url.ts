const G2B_HOME_URL = 'https://www.g2b.go.kr';
const G2B_SINGLE_NOTICE_PATH = '/link/PNPE027_01/single/';

interface BuildNoticeSourceUrlParams {
    bidPbancNo?: unknown;
    bidPbancOrd?: unknown;
    bidNoticeDetailUrl?: unknown;
    bidNoticeUrl?: unknown;
    bidNoticeDetailUrlFromRawData?: unknown;
    bidNoticeUrlFromRawData?: unknown;
}

function toNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function toBidPbancNo(value: unknown): string | null {
    const raw = toNonEmptyString(value);
    if (!raw) {
        return null;
    }

    // 나라장터 공고번호는 영문/숫자 조합이 일반적이며 UUID를 허용하면 잘못된 원문 링크가 생성된다.
    if (isUuidLike(raw)) {
        return null;
    }

    if (!/^[A-Za-z0-9]{8,32}$/.test(raw)) {
        return null;
    }

    return raw;
}

function toHttpUrl(value: unknown): string | null {
    const raw = toNonEmptyString(value);
    if (!raw) {
        return null;
    }

    try {
        const parsed = new URL(raw);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch {
        return null;
    }

    return null;
}

function buildG2bSingleNoticeUrl(bidPbancNo: string, bidPbancOrd: string): string {
    const target = new URL(G2B_SINGLE_NOTICE_PATH, G2B_HOME_URL);
    target.searchParams.set('bidPbancNo', bidPbancNo);
    target.searchParams.set('bidPbancOrd', bidPbancOrd);
    return target.toString();
}

export function buildNoticeSourceUrl({
    bidPbancNo,
    bidPbancOrd,
    bidNoticeDetailUrl,
    bidNoticeUrl,
    bidNoticeDetailUrlFromRawData,
    bidNoticeUrlFromRawData,
}: BuildNoticeSourceUrlParams): string {
    const primaryNoticeUrl = toHttpUrl(bidNoticeUrlFromRawData) ?? toHttpUrl(bidNoticeUrl);
    if (primaryNoticeUrl) {
        return primaryNoticeUrl;
    }

    const detailUrl = toHttpUrl(bidNoticeDetailUrlFromRawData) ?? toHttpUrl(bidNoticeDetailUrl);
    if (detailUrl) {
        return detailUrl;
    }

    const pbancNo = toBidPbancNo(bidPbancNo);
    if (pbancNo) {
        const pbancOrd = toNonEmptyString(bidPbancOrd) ?? '000';
        return buildG2bSingleNoticeUrl(pbancNo, pbancOrd);
    }

    return G2B_HOME_URL;
}
