'use client';

const BOOKMARK_EVENT_NAME = 'playbid:bookmark-changed';
const BOOKMARK_STORAGE_KEY = 'playbid:bookmark-changed';

export interface BookmarkChangeEventPayload {
    noticeId: string;
    isBookmarked: boolean;
    updatedAt: number;
}

export function publishBookmarkChange(noticeId: string, isBookmarked: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }

    const payload: BookmarkChangeEventPayload = {
        noticeId,
        isBookmarked,
        updatedAt: Date.now(),
    };

    window.dispatchEvent(new CustomEvent<BookmarkChangeEventPayload>(BOOKMARK_EVENT_NAME, { detail: payload }));

    try {
        window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // storage 권한이 없는 환경에서는 커스텀 이벤트만 사용
    }
}

export function subscribeBookmarkChange(
    onChange: (payload: BookmarkChangeEventPayload) => void
): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const customEventHandler = (event: Event) => {
        const detail = (event as CustomEvent<BookmarkChangeEventPayload>).detail;
        if (detail?.noticeId) {
            onChange(detail);
        }
    };

    const storageEventHandler = (event: StorageEvent) => {
        if (event.key !== BOOKMARK_STORAGE_KEY || !event.newValue) {
            return;
        }

        try {
            const parsed = JSON.parse(event.newValue) as BookmarkChangeEventPayload;
            if (parsed?.noticeId) {
                onChange(parsed);
            }
        } catch {
            // ignore
        }
    };

    window.addEventListener(BOOKMARK_EVENT_NAME, customEventHandler as EventListener);
    window.addEventListener('storage', storageEventHandler);

    return () => {
        window.removeEventListener(BOOKMARK_EVENT_NAME, customEventHandler as EventListener);
        window.removeEventListener('storage', storageEventHandler);
    };
}
