import { act, render, screen } from '@testing-library/react';
import { NoticeDeadlineCard } from '../notice-deadline-card';

describe('NoticeDeadlineCard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-02-23T00:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('마감이 24시간 초과로 남으면 D-day 형식으로 노출한다', () => {
        render(
            <NoticeDeadlineCard
                bidDeadlineAtIso="2026-02-26T00:00:00.000Z"
                bidDeadlineAtLabel="2026.02.26 09:00"
            />
        );

        expect(screen.getByText('D-3')).toBeInTheDocument();
        expect(screen.getByText('마감까지 남은 시간')).toBeInTheDocument();
    });

    it('마감이 24시간 이내면 시:분:초 카운트다운을 노출한다', () => {
        render(
            <NoticeDeadlineCard
                bidDeadlineAtIso="2026-02-23T06:00:00.000Z"
                bidDeadlineAtLabel="2026.02.23 15:00"
            />
        );

        expect(screen.getByText('마감 24시간 이내')).toBeInTheDocument();
        expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
    });

    it('카운트다운은 1초 단위로 갱신된다', () => {
        render(
            <NoticeDeadlineCard
                bidDeadlineAtIso="2026-02-23T00:00:03.000Z"
                bidDeadlineAtLabel="2026.02.23 09:00"
            />
        );

        expect(screen.getByText('00:00:03')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText('00:00:02')).toBeInTheDocument();
    });

    it('마감 시점이 지났으면 마감 상태를 노출한다', () => {
        render(
            <NoticeDeadlineCard
                bidDeadlineAtIso="2026-02-22T23:59:59.000Z"
                bidDeadlineAtLabel="2026.02.22 23:59"
            />
        );

        expect(screen.getByText('마감')).toBeInTheDocument();
        expect(screen.getByText('마감 시간이 지났습니다.')).toBeInTheDocument();
    });
});
