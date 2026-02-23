# Requirements Document

## Introduction

PlayBid는 나라장터(KONEPS) 입찰 공고 데이터를 기반으로 검색, 분석, 모의입찰, 학습 기능을 제공하는 입찰 지원 플랫폼입니다. 현재 Flutter 기반 모바일 앱으로 운영 중이며, 실무 사용자의 데스크톱 환경 니즈에 대응하기 위해 Next.js 기반 웹 버전으로 확장합니다.

본 문서는 기존 Flutter 앱의 핵심 기능을 웹 환경에 맞게 재구성하고, Vultr VPS 환경의 self-hosting Supabase와 연동하여 전문 실무자용 웹 경험을 제공하기 위한 요구사항을 정의합니다.

## Glossary

- **System**: Next.js 기반 PlayBid 웹 애플리케이션
- **User**: 입찰 담당자, 의사결정자, 초급 실무자를 포함한 모든 사용자
- **Guest**: 비로그인 상태의 사용자
- **Authenticated_User**: 로그인 완료된 사용자
- **Paid_User**: 유료 구독 또는 포인트를 보유한 사용자
- **Bid_Notice**: 나라장터 입찰 공고 데이터
- **Opening_Result**: 개찰 결과 데이터
- **Mock_Bid**: 사용자가 입력한 모의 입찰 데이터
- **Bookmark**: 사용자가 저장한 관심 공고
- **AI_Report**: 공고/개찰/이력 데이터 기반 AI 분석 보고서
- **Participant_Stats**: 참가업체 투찰 통계
- **Similar_Rate_Stats**: 과거 유사 입찰 사정율 통계
- **Qualification_Calculator**: 적격심사 점수 계산기
- **Supabase**: PostgreSQL 기반 백엔드 데이터베이스 및 인증 서비스
- **RLS**: Row Level Security, Supabase의 행 수준 보안 정책
- **SSR**: Server-Side Rendering, Next.js의 서버 사이드 렌더링
- **Idempotency_Key**: 중복 요청 방지를 위한 고유 키

## Requirements

### Requirement 1: 사용자 인증 및 권한 관리

**User Story:** As a User, I want to access the system with appropriate permissions, so that I can use features according to my account status.

#### Acceptance Criteria

1. WHEN a Guest accesses the System, THE System SHALL allow viewing of Bid_Notice and Opening_Result data
2. WHEN a Guest attempts to save or participate in features, THE System SHALL trigger the login flow (modal or redirect) and preserve the intended return path
3. WHEN an Authenticated_User logs in via OAuth, THE System SHALL restore the original navigation path after authentication
4. WHEN authentication state changes, THE System SHALL immediately update routing and permission checks
5. THE System SHALL implement RLS policies for all user-specific data tables
6. WHEN a Paid_User accesses premium features, THE System SHALL verify subscription status or point balance before execution

### Requirement 2: 대시보드 및 요약 정보

**User Story:** As an Authenticated_User, I want to see a summary of today's important information, so that I can quickly identify urgent tasks.

#### Acceptance Criteria

1. THE System SHALL display the count of Bid_Notices closing today
2. THE System SHALL display the count of Opening_Results scheduled or completed today
3. THE System SHALL display summary cards for the User's Bookmarks and Mock_Bids
4. THE System SHALL display notification badges with unread count
5. WHEN the User clicks on a summary card, THE System SHALL navigate to the detailed view
6. THE System SHALL refresh dashboard data within 15 minutes of cache expiration

### Requirement 3: 입찰공고 탐색 및 필터링

**User Story:** As a User, I want to search and filter Bid_Notices efficiently, so that I can find relevant opportunities quickly.

#### Acceptance Criteria

1. THE System SHALL support keyword search across Bid_Notice title and organization fields
2. THE System SHALL provide filters for category, price range, deadline, and organization
3. THE System SHALL support sorting by latest, deadline proximity, and price
4. WHEN a User applies filters, THE System SHALL preserve filter state during navigation
5. THE System SHALL implement pagination or infinite scroll for Bid_Notice lists
6. THE System SHALL display data freshness timestamp on list views
7. WHEN no results match the filter criteria, THE System SHALL display an empty state message

### Requirement 4: 입찰공고 상세 정보

**User Story:** As a User, I want to view comprehensive details of a Bid_Notice, so that I can make informed decisions.

#### Acceptance Criteria

1. THE System SHALL display core fields including organization, method, schedule, price, and participation conditions
2. THE System SHALL provide a Bookmark toggle action
3. THE System SHALL provide a link to start Mock_Bid
4. THE System SHALL provide a link to the original KONEPS notice
5. THE System SHALL display data reliability indicators including update timestamp and source
6. WHERE the Bid_Notice requires qualification screening, THE System SHALL display a link to Qualification_Calculator
7. THE System SHALL display premium feature entry cards for AI_Report, Participant_Stats, and Similar_Rate_Stats

### Requirement 5: 모의입찰 실행 및 결과

**User Story:** As an Authenticated_User, I want to submit a Mock_Bid and see the result, so that I can practice bidding strategies.

#### Acceptance Criteria

1. WHEN a User enters a bid amount, THE System SHALL display the recommended price range
2. THE System SHALL calculate and display the ratio to estimated price
3. THE System SHALL display success probability based on historical data
4. WHEN a User submits a Mock_Bid, THE System SHALL save the submission to user_bid_history table
5. THE System SHALL display result screens based on status: success, fail, pending, or void
6. THE System SHALL link Mock_Bid results to the User's bid history

### Requirement 6: 개찰결과 조회 및 분석

**User Story:** As a User, I want to view Opening_Results and analyze my participation, so that I can improve future strategies.

#### Acceptance Criteria

1. THE System SHALL display a list of Opening_Results with status and date filters
2. WHEN a User views an Opening_Result detail, THE System SHALL display summary metrics including winning price, participant count, and deviation
3. THE System SHALL link Opening_Results to the original Bid_Notice
4. WHERE the User participated in the bid, THE System SHALL display comparison analysis with actual results
5. THE System SHALL provide actions to generate AI_Report or view Participant_Stats
6. WHEN result data is incomplete, THE System SHALL display an informative message

### Requirement 7: 유료 서비스 실행 및 과금

**User Story:** As a Paid_User, I want to use premium features with clear pricing, so that I can access advanced analysis tools.

#### Acceptance Criteria

1. THE System SHALL provide four premium features: AI_Report, Participant_Stats, Similar_Rate_Stats, and Qualification_Calculator
2. WHEN a User initiates a premium feature, THE System SHALL display pricing mode options: subscription allowance or point deduction
3. THE System SHALL verify User authorization before executing premium features
4. WHEN a premium feature executes successfully, THE System SHALL deduct the appropriate cost from subscription allowance or point balance
5. THE System SHALL save execution results with generation timestamp and model version
6. WHEN the same input parameters are used within 24 hours, THE System SHALL allow re-access without additional charges
7. IF execution fails due to server error, THEN THE System SHALL automatically refund consumed points or allowance
8. THE System SHALL use Idempotency_Key to prevent duplicate charges
9. THE System SHALL display remaining balance after each premium feature execution

### Requirement 8: 북마크 관리

**User Story:** As an Authenticated_User, I want to bookmark Bid_Notices, so that I can track opportunities of interest.

#### Acceptance Criteria

1. WHEN a User toggles a Bookmark, THE System SHALL immediately update the bookmark state
2. THE System SHALL display a list of all User Bookmarks with sorting options
3. THE System SHALL display deadline proximity indicators for bookmarked Bid_Notices
4. WHEN a bookmarked Bid_Notice is within 24 hours of deadline, THE System SHALL highlight it in the dashboard
5. THE System SHALL allow Users to remove Bookmarks from both detail and list views

### Requirement 9: 알림 시스템

**User Story:** As an Authenticated_User, I want to receive notifications about important events, so that I don't miss critical deadlines.

#### Acceptance Criteria

1. THE System SHALL display unread notification count in the header
2. WHEN a User clicks the notification icon, THE System SHALL navigate to the notification list
3. THE System SHALL mark notifications as read when viewed
4. THE System SHALL send notifications for deadline proximity, opening results, and system announcements
5. THE System SHALL store notification preferences in the `notification_preferences` table and keep profile settings in `user_profiles`/`profiles`

### Requirement 10: 프로필 및 구독 관리

**User Story:** As an Authenticated_User, I want to manage my profile and subscription, so that I can control my account settings.

#### Acceptance Criteria

1. THE System SHALL display User profile information including name, email, and join date
2. THE System SHALL display current subscription plan and expiration date
3. THE System SHALL provide a link to manage subscription and payment methods
4. THE System SHALL display point balance and transaction history
5. THE System SHALL allow Users to update notification preferences
6. THE System SHALL provide links to terms of service and privacy policy

### Requirement 11: 반응형 레이아웃

**User Story:** As a User, I want the System to adapt to my device screen size, so that I can use it comfortably on any device.

#### Acceptance Criteria

1. THE System SHALL implement a sidebar navigation layout for desktop screens (1440px and above)
2. THE System SHALL collapse the sidebar for tablet screens (1024px to 1439px)
3. THE System SHALL use a stacked layout for mobile web screens (below 1024px)
4. THE System SHALL maintain readability and usability across all breakpoints
5. THE System SHALL prioritize core CTAs in mobile layouts

### Requirement 12: 성능 및 응답성

**User Story:** As a User, I want the System to respond quickly, so that I can work efficiently.

#### Acceptance Criteria

1. THE System SHALL achieve initial page load within 3 seconds
2. THE System SHALL respond to list API requests within 1 second
3. THE System SHALL implement loading skeletons for data-fetching states
4. THE System SHALL cache dashboard aggregations with 15-minute refresh intervals
5. THE System SHALL implement optimistic UI updates for user actions like bookmarking

### Requirement 13: 오류 처리 및 복구

**User Story:** As a User, I want clear error messages and recovery options, so that I can resolve issues independently.

#### Acceptance Criteria

1. WHEN an API request fails, THE System SHALL display an error message with cause and suggested action
2. THE System SHALL provide a retry button for transient errors
3. THE System SHALL log errors with request ID for debugging
4. WHEN authentication expires, THE System SHALL redirect to login with return path preserved
5. THE System SHALL display empty state messages when no data is available

### Requirement 14: 데이터 동기화 및 신뢰성

**User Story:** As a User, I want to trust the data accuracy, so that I can make reliable decisions.

#### Acceptance Criteria

1. THE System SHALL synchronize Bid_Notice data at least twice daily
2. THE System SHALL display the last successful synchronization timestamp
3. WHEN data is missing or incomplete, THE System SHALL display a notice to the User
4. THE System SHALL validate data integrity before displaying to Users
5. IF synchronization fails, THEN THE System SHALL display the last known good data with a staleness warning

### Requirement 15: 접근성 및 키보드 탐색

**User Story:** As a User, I want to navigate the System using keyboard shortcuts, so that I can work more efficiently.

#### Acceptance Criteria

1. THE System SHALL support keyboard navigation for search, filters, and list views
2. THE System SHALL maintain WCAG AA color contrast standards
3. THE System SHALL provide focus indicators for interactive elements
4. THE System SHALL support tab navigation through forms and CTAs
5. THE System SHALL provide skip-to-content links for screen readers

### Requirement 16: 보안 및 데이터 보호

**User Story:** As a User, I want my data to be secure, so that I can trust the System with sensitive information.

#### Acceptance Criteria

1. THE System SHALL implement RLS policies for all user-specific tables
2. THE System SHALL validate user permissions on both client and server
3. THE System SHALL sanitize user inputs to prevent injection attacks
4. THE System SHALL use secure session management via Supabase SSR
5. THE System SHALL log authentication and critical actions for audit purposes
6. THE System SHALL not expose sensitive information in error messages or logs

### Requirement 17: 기존 Flutter 앱 호환성

**User Story:** As a System Administrator, I want the web version to coexist with the mobile app, so that both platforms can operate without conflicts.

#### Acceptance Criteria

1. THE System SHALL reuse existing database tables used by Flutter app contracts: bid_notices, bid_results, user_bid_history, user_scraps, notifications, notification_preferences, user_profiles, profiles
2. THE System SHALL add new tables for web-specific features without modifying existing table structures
3. THE System SHALL use additive schema changes only (ADD COLUMN, CREATE TABLE)
4. THE System SHALL maintain compatibility with existing Flutter app API contracts, including existing column names and status field conventions
5. THE System SHALL use shared identification keys (bid_ntce_no, bid_ntce_ord) and existing surrogate keys (id, bid_notice_id) across platforms
6. THE System SHALL implement web-specific queries as database views or RPC functions
7. THE System SHALL normalize category values consistently across platforms (e.g. product↔goods mapping rules)

### Requirement 18: 유료 기능 트랜잭션 무결성

**User Story:** As a Paid_User, I want premium feature charges to be accurate and reliable, so that I am not overcharged or underserved.

#### Acceptance Criteria

1. THE System SHALL execute premium features using a single transactional API: execute_paid_feature
2. THE System SHALL process transactions in order: authorization check, pricing verification, deduction reservation, feature execution, result storage, final commit
3. IF any step fails before commit, THEN THE System SHALL rollback the entire transaction
4. IF failure is detected after commit, THEN THE System SHALL execute a compensating transaction to refund the User
5. THE System SHALL prevent duplicate charges using Idempotency_Key validation
6. THE System SHALL store execution metadata including model version, generation timestamp, and input parameters for reproducibility

### Requirement 19: 파서 및 데이터 변환

**User Story:** As a System, I want to parse and transform KONEPS data reliably, so that Users receive accurate information.

#### Acceptance Criteria

1. WHEN KONEPS raw data is received, THE System SHALL parse it into structured Bid_Notice objects
2. WHEN parsing fails, THE System SHALL log the error with raw data sample and return a descriptive error message
3. THE System SHALL format Bid_Notice objects back into display-ready JSON
4. FOR ALL valid Bid_Notice objects, parsing then formatting then parsing SHALL produce an equivalent object (round-trip property)
5. THE System SHALL validate required fields before storing parsed data

### Requirement 20: 적격심사 계산기 정확성

**User Story:** As a User, I want the Qualification_Calculator to produce accurate scores, so that I can trust the simulation results.

#### Acceptance Criteria

1. WHEN a User inputs qualification parameters, THE System SHALL calculate scores based on official KONEPS rules
2. THE System SHALL display score breakdown by category
3. THE System SHALL compare calculated score against cutoff threshold
4. THE System SHALL save calculation inputs and results for future reference
5. FOR ALL valid input sets, recalculating with the same inputs SHALL produce identical results (idempotence property)


### Requirement 21: 라이트/다크 모드 선택

**User Story:** As a User, I want to choose between light and dark display modes, so that I can use the System comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL detect the User's operating system theme preference on initial load
2. THE System SHALL provide a theme toggle control in the header or settings menu
3. WHEN a User selects a theme mode, THE System SHALL immediately apply the selected theme to all UI components
4. THE System SHALL persist the User's theme preference in local storage
5. WHEN a User returns to the System, THE System SHALL restore the previously selected theme preference
6. WHERE a User has not manually selected a theme, THE System SHALL follow the operating system theme preference
7. THE System SHALL maintain WCAG AA color contrast standards in both light and dark modes
8. THE System SHALL apply theme changes without requiring page reload

### Requirement 22: 입찰참가이력 페이지

**User Story:** As an Authenticated_User, I want to view and analyze my past Mock_Bid participation history, so that I can learn from previous bidding patterns and improve my strategy.

#### Acceptance Criteria

1. THE System SHALL display a list of all User's Mock_Bid records from user_bid_history table
2. THE System SHALL provide filters for bid status (success, fail, pending, void), date range, and organization
3. THE System SHALL provide sorting options by date, bid amount, and success probability
4. WHEN a User views bid history, THE System SHALL display summary statistics including total bids, success rate, and average deviation from winning price
5. THE System SHALL link each Mock_Bid record to the corresponding Bid_Notice and Opening_Result when available
6. WHERE an Opening_Result exists for a Mock_Bid, THE System SHALL display comparison analysis showing User's bid amount versus actual winning price
7. THE System SHALL calculate and display aggregate statistics including win rate by category, average bid ratio, and monthly participation trends
8. THE System SHALL allow Users to export bid history data in CSV format
9. WHEN a User clicks on a bid history record, THE System SHALL navigate to the detailed view with full bid parameters and result analysis
10. THE System SHALL implement pagination for bid history lists with configurable page size
