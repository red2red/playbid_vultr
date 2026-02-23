import type { NoticeCategory } from './notice-detail-types';

const FALLBACK_CATEGORY: NoticeCategory = 'unknown';

export function normalizeCategory(category: string | null | undefined): NoticeCategory {
    if (!category) {
        return FALLBACK_CATEGORY;
    }

    const normalized = category.toLowerCase().trim();

    if (normalized === 'product' || normalized === 'goods') {
        return 'goods';
    }

    if (normalized === 'construction') {
        return 'construction';
    }

    if (normalized === 'service') {
        return 'service';
    }

    return FALLBACK_CATEGORY;
}

export function getDisplayCategory(category: string | null | undefined): NoticeCategory {
    if (!category) {
        return FALLBACK_CATEGORY;
    }

    const normalized = category.toLowerCase().trim();

    if (normalized === 'goods') {
        return 'product';
    }

    if (
        normalized === 'product' ||
        normalized === 'construction' ||
        normalized === 'service'
    ) {
        return normalized;
    }

    return FALLBACK_CATEGORY;
}

export function getCategoryQueryValues(category: string | null | undefined): NoticeCategory[] {
    const normalized = normalizeCategory(category);

    if (normalized === 'goods') {
        return ['goods', 'product'];
    }

    if (normalized === 'unknown') {
        return ['construction', 'service', 'goods', 'product'];
    }

    return [normalized];
}

export function getCategoryLabel(category: NoticeCategory): string {
    switch (category) {
        case 'construction':
            return '공사';
        case 'service':
            return '용역';
        case 'goods':
        case 'product':
            return '물품';
        default:
            return '기타';
    }
}
