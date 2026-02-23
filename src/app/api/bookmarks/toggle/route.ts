import { NextRequest, NextResponse } from 'next/server';
import {
    BookmarkAuthError,
    toggleBookmarkForCurrentUser,
} from '@/lib/bid/bookmark-service';
import { createApiErrorResponse } from '@/lib/api/error-response';

interface ToggleBookmarkBody {
    noticeId?: string;
    noticeNumber?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ToggleBookmarkBody;
        const noticeId = body.noticeId?.trim();
        const noticeNumber = body.noticeNumber?.trim();

        if (!noticeId) {
            return createApiErrorResponse({
                status: 400,
                code: 'INVALID_REQUEST',
                message: 'noticeId가 필요합니다.',
            });
        }

        const result = await toggleBookmarkForCurrentUser({ noticeId, noticeNumber });

        return NextResponse.json({
            ok: true,
            isBookmarked: result.isBookmarked,
        });
    } catch (error) {
        if (error instanceof BookmarkAuthError) {
            return createApiErrorResponse({
                status: 401,
                code: 'AUTH_REQUIRED',
                message: error.message,
            });
        }

        return createApiErrorResponse({
            status: 500,
            code: 'BOOKMARK_TOGGLE_FAILED',
            message: '북마크 처리 중 오류가 발생했습니다.',
            cause: error,
        });
    }
}
