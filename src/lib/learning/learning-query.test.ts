import { normalizeFlashcardFilter } from './learning-query';

describe('learning-query helpers', () => {
    it('flashcard 필터 파라미터를 정규화한다', () => {
        expect(normalizeFlashcardFilter(undefined)).toBe('all');
        expect(normalizeFlashcardFilter('term')).toBe('term');
        expect(normalizeFlashcardFilter('CONCEPT')).toBe('concept');
        expect(normalizeFlashcardFilter('law')).toBe('law');
        expect(normalizeFlashcardFilter('tip')).toBe('tip');
        expect(normalizeFlashcardFilter('unknown')).toBe('all');
    });
});
