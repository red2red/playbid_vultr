import { NextRequest, NextResponse } from 'next/server';
import { getBidHistoryExportCsv } from '@/lib/bid/bid-history-query';
import { createApiErrorResponse } from '@/lib/api/error-response';

function toParamsRecord(searchParams: URLSearchParams): Record<string, string> {
    return Object.fromEntries(searchParams.entries());
}

function toHttpStatus(code: string): number {
    if (code === 'BID_HISTORY_AUTH_REQUIRED') {
        return 401;
    }
    if (code.includes('NOT_FOUND')) {
        return 404;
    }
    return 500;
}

export async function GET(request: NextRequest) {
    const params = toParamsRecord(request.nextUrl.searchParams);
    const payload = await getBidHistoryExportCsv(params);

    if (payload.error) {
        return createApiErrorResponse({
            status: toHttpStatus(payload.error.code),
            code: payload.error.code,
            message: payload.error.message,
            suggestion: payload.error.suggestion,
            requestId: payload.error.requestId,
            context: {
                route: '/api/bid-history/export',
            },
        });
    }

    return new NextResponse(payload.csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${payload.filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}
