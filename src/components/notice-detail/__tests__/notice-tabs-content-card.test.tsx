import { fireEvent, render, screen } from '@testing-library/react';
import { NoticeTabsContentCard } from '../notice-tabs-content-card';

describe('NoticeTabsContentCard', () => {
    const sections = {
        overview: '사업개요 내용',
        qualification: '참가자격 내용',
        documents: '제출서류 내용',
        etc: '기타사항 내용',
    };

    it('기본으로 사업개요 탭을 보여준다', () => {
        render(<NoticeTabsContentCard sections={sections} />);

        const overviewTab = screen.getByRole('tab', { name: '사업개요' });
        expect(overviewTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel')).toHaveTextContent(sections.overview);
    });

    it('탭 클릭 시 해당 탭 내용을 렌더링한다', () => {
        render(<NoticeTabsContentCard sections={sections} />);

        const qualificationTab = screen.getByRole('tab', { name: '참가자격' });
        fireEvent.click(qualificationTab);

        expect(qualificationTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel')).toHaveTextContent(sections.qualification);
    });
});
