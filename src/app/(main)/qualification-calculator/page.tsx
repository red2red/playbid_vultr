import { QualificationCalculatorPage } from '@/components/qualification-calculator/qualification-calculator-page';
import { getQualificationCalculatorPageData } from '@/lib/bid/qualification-calculator-query';

interface QualificationCalculatorRoutePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QualificationCalculatorRoutePage({
    searchParams,
}: QualificationCalculatorRoutePageProps) {
    const resolvedParams = (await searchParams) ?? {};
    const data = await getQualificationCalculatorPageData(resolvedParams);

    return <QualificationCalculatorPage data={data} />;
}
