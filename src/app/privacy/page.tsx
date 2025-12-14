import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 - PlayBid",
    description: "PlayBid 개인정보처리방침",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 relative flex items-center justify-center">
                            <Image src="/logo.png" alt="PlayBid Logo" width={32} height={32} className="object-contain" />
                        </div>
                        <span className="text-lg font-bold text-slate-900">PlayBid</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-slate-900 mb-8">개인정보처리방침</h1>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">1. 개인정보 수집 항목</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            PlayBid(이하 "회사")는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li><strong>필수 항목:</strong> 이메일 주소, 소셜 로그인 식별자(Google, Kakao, Naver, Apple)</li>
                            <li><strong>선택 항목:</strong> 프로필 사진, 닉네임, 관심 업종/지역</li>
                            <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그, 앱 사용 통계</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">2. 개인정보 수집 및 이용 목적</h2>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>회원 가입 및 관리: 회원 식별, 서비스 제공</li>
                            <li>서비스 제공: 입찰 정보 제공, 맞춤형 콘텐츠 제공</li>
                            <li>마케팅 및 광고: 이벤트 정보 안내 (동의 시)</li>
                            <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">3. 개인정보 보유 및 이용 기간</h2>
                        <p className="text-slate-600 leading-relaxed">
                            회원 탈퇴 시 즉시 파기하며, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                        </p>
                        <ul className="list-disc list-inside text-slate-600 space-y-2 mt-4">
                            <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                            <li>표시/광고에 관한 기록: 6개월</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">4. 개인정보의 제3자 제공</h2>
                        <p className="text-slate-600 leading-relaxed">
                            회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.
                            다만, 법률에 의해 요구되는 경우는 예외로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">5. 개인정보 처리 위탁</h2>
                        <p className="text-slate-600 leading-relaxed">
                            회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.
                        </p>
                        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-slate-700">수탁업체</th>
                                        <th className="px-4 py-2 text-left text-slate-700">위탁업무</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr className="border-t border-slate-200">
                                        <td className="px-4 py-2">Supabase</td>
                                        <td className="px-4 py-2">데이터베이스 호스팅, 인증 서비스</td>
                                    </tr>
                                    <tr className="border-t border-slate-200">
                                        <td className="px-4 py-2">Firebase (Google)</td>
                                        <td className="px-4 py-2">푸시 알림 서비스</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">6. 이용자의 권리</h2>
                        <ul className="list-disc list-inside text-slate-600 space-y-2">
                            <li>개인정보 열람, 정정, 삭제 요청</li>
                            <li>개인정보 처리 정지 요청</li>
                            <li>회원 탈퇴를 통한 동의 철회</li>
                        </ul>
                        <p className="text-slate-600 mt-4">
                            위 권리 행사는 앱 내 설정 또는 고객센터(support@playbid.kr)를 통해 가능합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">7. 개인정보 보호책임자</h2>
                        <ul className="text-slate-600 space-y-1">
                            <li>담당자: PlayBid 개인정보보호팀</li>
                            <li>이메일: privacy@playbid.kr</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">8. 개인정보 처리방침 변경</h2>
                        <p className="text-slate-600 leading-relaxed">
                            본 방침은 시행일로부터 적용되며, 변경 시 앱 및 웹사이트를 통해 공지합니다.
                        </p>
                    </section>

                    <section className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                            시행일: 2024년 12월 1일<br />
                            최종 수정일: 2024년 12월 1일
                        </p>
                    </section>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                        ← 홈으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
