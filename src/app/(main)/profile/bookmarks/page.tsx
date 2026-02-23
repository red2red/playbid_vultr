import { BookmarkListPage } from '@/components/bookmarks/bookmark-list-page';
import { getBookmarkListData } from '@/lib/bid/bookmark-list-query';

interface ProfileBookmarksRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfileBookmarksRoutePage({
    searchParams,
}: ProfileBookmarksRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getBookmarkListData(resolvedParams);

    return <BookmarkListPage data={data} />;
}
