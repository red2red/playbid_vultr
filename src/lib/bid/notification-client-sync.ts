export type NotificationChangeAction = 'read' | 'read_all' | 'delete' | 'create';

export interface NotificationChangePayload {
    action: NotificationChangeAction;
    notificationIds?: string[];
    unreadCount?: number;
    updatedAt: string;
}

const STORAGE_KEY = 'playbid:notification-change';
const EVENT_NAME = 'playbid:notification-change';

function isClient(): boolean {
    return typeof window !== 'undefined';
}

export function publishNotificationChange(payload: Omit<NotificationChangePayload, 'updatedAt'>): void {
    if (!isClient()) {
        return;
    }

    const eventPayload: NotificationChangePayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
    };

    window.dispatchEvent(new CustomEvent<NotificationChangePayload>(EVENT_NAME, { detail: eventPayload }));

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(eventPayload));
    } catch {
        // localStorage 접근 불가 환경 무시
    }
}

function parsePayload(raw: string | null): NotificationChangePayload | null {
    if (!raw) {
        return null;
    }

    try {
        const parsed = JSON.parse(raw) as NotificationChangePayload;
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        if (
            parsed.action !== 'read' &&
            parsed.action !== 'read_all' &&
            parsed.action !== 'delete' &&
            parsed.action !== 'create'
        ) {
            return null;
        }

        return {
            action: parsed.action,
            notificationIds: Array.isArray(parsed.notificationIds)
                ? parsed.notificationIds.filter((id): id is string => typeof id === 'string')
                : undefined,
            unreadCount: typeof parsed.unreadCount === 'number' ? parsed.unreadCount : undefined,
            updatedAt:
                typeof parsed.updatedAt === 'string' && parsed.updatedAt.trim().length > 0
                    ? parsed.updatedAt
                    : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

export function subscribeNotificationChange(
    listener: (payload: NotificationChangePayload) => void
): () => void {
    if (!isClient()) {
        return () => undefined;
    }

    const onCustomEvent = (event: Event) => {
        const payload = (event as CustomEvent<NotificationChangePayload>).detail;
        if (payload) {
            listener(payload);
        }
    };

    const onStorageEvent = (event: StorageEvent) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }

        const payload = parsePayload(event.newValue);
        if (payload) {
            listener(payload);
        }
    };

    window.addEventListener(EVENT_NAME, onCustomEvent as EventListener);
    window.addEventListener('storage', onStorageEvent);

    return () => {
        window.removeEventListener(EVENT_NAME, onCustomEvent as EventListener);
        window.removeEventListener('storage', onStorageEvent);
    };
}
