import { createClient } from '@/lib/supabase/server';
import type {
    QualificationCalculationSavePayload,
    QualificationResultStatus,
} from './qualification-calculator-types';

type AnyRecord = Record<string, unknown>;

export class QualificationCalculationAuthError extends Error {
    constructor(message = '로그인이 필요합니다.') {
        super(message);
        this.name = 'QualificationCalculationAuthError';
    }
}

export class QualificationCalculationUnavailableError extends Error {
    constructor(message = '적격심사 계산 저장 기능을 사용할 수 없습니다.') {
        super(message);
        this.name = 'QualificationCalculationUnavailableError';
    }
}

export interface QualificationCalculationHistoryItem {
    id: string;
    createdAt: string | null;
    noticeName: string | null;
    noticeNumber: string | null;
    finalBidRate: number | null;
    targetAmount: number | null;
    status: QualificationResultStatus | null;
    message: string | null;
}

function asRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as AnyRecord;
}

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
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
}

function isMissingTableError(error: unknown): boolean {
    const record = asRecord(error);
    if (!record) {
        return false;
    }

    const code = asString(record.code);
    if (code === '42P01') {
        return true;
    }

    const message = asString(record.message)?.toLowerCase();
    return Boolean(message?.includes('does not exist') || message?.includes('relation'));
}

function isMissingColumnError(error: unknown): boolean {
    const record = asRecord(error);
    if (!record) {
        return false;
    }

    const code = asString(record.code);
    if (code === '42703') {
        return true;
    }

    const message = asString(record.message)?.toLowerCase();
    return Boolean(message?.includes('column') && message?.includes('does not exist'));
}

async function getCurrentUserId(): Promise<string | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

function mapHistoryRow(row: AnyRecord): QualificationCalculationHistoryItem {
    const snapshot =
        asRecord(row.result_snapshot) ??
        asRecord(row.result_payload) ??
        asRecord(row.result) ??
        asRecord(asRecord(row.payload)?.result);
    const snapshotStatus = asString(snapshot?.['status']);

    return {
        id: asString(row.id) ?? `${Date.now()}`,
        createdAt: asString(row.created_at) ?? asString(row.saved_at),
        noticeName: asString(row.notice_name) ?? asString(asRecord(row.metadata)?.noticeName),
        noticeNumber: asString(row.bid_ntce_no) ?? asString(row.notice_number),
        finalBidRate: asNumber(snapshot?.['finalBidRate']),
        targetAmount: asNumber(snapshot?.['targetAmount']),
        status:
            snapshotStatus === 'success' || snapshotStatus === 'warning' || snapshotStatus === 'error'
                ? (snapshotStatus as QualificationResultStatus)
                : null,
        message: asString(snapshot?.['message']),
    };
}

export async function listQualificationCalculationsForCurrentUser(
    limit = 8
): Promise<QualificationCalculationHistoryItem[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new QualificationCalculationAuthError();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('qualification_calculations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(Math.max(1, Math.min(limit, 20)));

    if (error) {
        if (isMissingTableError(error)) {
            throw new QualificationCalculationUnavailableError();
        }
        throw new Error('적격심사 계산 이력을 불러오지 못했습니다.');
    }

    return (data as AnyRecord[]).map(mapHistoryRow);
}

export async function saveQualificationCalculationForCurrentUser(
    payload: QualificationCalculationSavePayload
): Promise<{ id: string | null; createdAt: string | null }> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new QualificationCalculationAuthError();
    }

    const supabase = await createClient();
    const row: Record<string, unknown> = {
        user_id: userId,
        bid_notice_id: payload.noticeId,
        bid_ntce_no: payload.noticeNumber,
        category: payload.category,
        review_master_id: payload.reviewMasterId,
        input_snapshot: payload.input,
        result_snapshot: payload.result,
        metadata: {
            savedAt: new Date().toISOString(),
        },
    };

    const { data, error } = await supabase
        .from('qualification_calculations')
        .insert(row)
        .select('id,created_at')
        .limit(1);

    if (error) {
        if (isMissingTableError(error) || isMissingColumnError(error)) {
            throw new QualificationCalculationUnavailableError();
        }
        throw new Error('적격심사 계산 결과 저장에 실패했습니다.');
    }

    const created = asRecord((data as AnyRecord[] | null)?.[0]);
    return {
        id: asString(created?.id),
        createdAt: asString(created?.created_at),
    };
}
