import { buildNoticeSourceUrl } from './notice-source-url';

describe('buildNoticeSourceUrl', () => {
    it('uses bid_ntce_url before bid_ntce_dtl_url', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeDetailUrl: 'https://www.g2b.go.kr:8101/ep/preparation/preView.do?test=1',
                bidNoticeUrl: 'https://www.g2b.go.kr/link/example-main',
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe('https://www.g2b.go.kr/link/example-main');
    });

    it('falls back to bid_ntce_url when detail url is missing', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeDetailUrl: '',
                bidNoticeUrl: 'https://www.g2b.go.kr/common/link?foo=bar',
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe('https://www.g2b.go.kr/common/link?foo=bar');
    });

    it('uses raw_data bidNtceUrl with top priority when present', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeUrlFromRawData: 'https://www.g2b.go.kr/raw/main-url',
                bidNoticeUrl: 'https://www.g2b.go.kr/common/link?foo=bar',
                bidNoticeDetailUrl: 'https://www.g2b.go.kr:8101/ep/preparation/preView.do?test=1',
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe('https://www.g2b.go.kr/raw/main-url');
    });

    it('uses raw_data bidNtceDtlUrl when main notice url is absent', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeDetailUrlFromRawData: 'https://www.g2b.go.kr/raw/detail-url',
                bidNoticeDetailUrl: 'https://www.g2b.go.kr:8101/ep/preparation/preView.do?test=1',
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe('https://www.g2b.go.kr/raw/detail-url');
    });

    it('builds G2B single page link from bidPbancNo and bidPbancOrd', () => {
        expect(
            buildNoticeSourceUrl({
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe(
            'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=R26BK01366842&bidPbancOrd=000'
        );
    });

    it('uses default order 000 when bidPbancOrd is missing', () => {
        expect(
            buildNoticeSourceUrl({
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '',
            })
        ).toBe(
            'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=R26BK01366842&bidPbancOrd=000'
        );
    });

    it('ignores non-http urls and safely falls back', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeDetailUrl: 'javascript:alert(1)',
                bidNoticeUrl: 'data:text/html,evil',
                bidPbancNo: 'R26BK01366842',
                bidPbancOrd: '000',
            })
        ).toBe(
            'https://www.g2b.go.kr/link/PNPE027_01/single/?bidPbancNo=R26BK01366842&bidPbancOrd=000'
        );
    });

    it('returns g2b home when no usable source exists', () => {
        expect(
            buildNoticeSourceUrl({
                bidNoticeDetailUrl: '',
                bidNoticeUrl: '',
                bidPbancNo: '',
                bidPbancOrd: '',
            })
        ).toBe('https://www.g2b.go.kr');
    });

    it('does not build single link when bidPbancNo is UUID-like', () => {
        expect(
            buildNoticeSourceUrl({
                bidPbancNo: '6027f1f5-ab30-459f-ae1d-3885b9b9e74e',
                bidPbancOrd: '001',
            })
        ).toBe('https://www.g2b.go.kr');
    });
});
