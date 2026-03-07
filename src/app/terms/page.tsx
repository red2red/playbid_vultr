import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";

export const metadata: Metadata = {
    title: "이용약관 - PlayBid",
    description: "PlayBid 서비스 이용약관",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <MeshGradientBackground />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 h-20 flex items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 relative flex items-center justify-center transition-transform group-hover:scale-95 group-hover:rotate-3">
                            <Image src="/logo.png" alt="PlayBid Logo" width={32} height={32} className="object-contain brightness-0 invert" />
                        </div>
                        <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">PlayBid</span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-32 relative z-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 tracking-tight">이용약관</h1>

                <div className="bg-card/50 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제1조 (목적)</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            본 약관은 PlayBid(이하 &quot;회사&quot;)가 제공하는 공공입찰 정보 서비스(이하 &quot;서비스&quot;)의
                            이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항과 기타 필요한 사항을
                            규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제2조 (정의)</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 marker:text-primary">
                            <li>&quot;서비스&quot;란 회사가 제공하는 공공입찰 정보 분석 및 예측 서비스를 말합니다.</li>
                            <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
                            <li>&quot;회원&quot;이란 서비스에 가입하여 계정을 부여받은 이용자를 말합니다.</li>
                            <li>&quot;콘텐츠&quot;란 서비스에서 제공하는 입찰 정보, 분석 데이터, 학습 자료 등을 말합니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제3조 (약관의 효력 및 변경)</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            1. 본 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력이 발생합니다.<br />
                            2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.<br />
                            3. 약관이 변경되는 경우 회사는 변경 사항을 서비스 화면에 공지합니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제4조 (서비스 이용)</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            1. 서비스는 회원가입 후 이용 가능합니다.<br />
                            2. 서비스의 일부 기능은 유료로 제공될 수 있습니다.<br />
                            3. 회사는 서비스의 안정적 운영을 위해 필요한 경우 서비스를 일시 중단할 수 있습니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제5조 (이용자의 의무)</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 marker:text-primary">
                            <li>이용자는 본 약관 및 관련 법령을 준수하여야 합니다.</li>
                            <li>이용자는 타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 하여서는 안 됩니다.</li>
                            <li>이용자는 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제6조 (면책조항)</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            1. 회사는 서비스에서 제공하는 입찰 예측 정보의 정확성을 보장하지 않습니다.<br />
                            2. 이용자의 입찰 결과에 대해 회사는 책임을 지지 않습니다.<br />
                            3. 서비스에서 제공하는 정보는 참고 목적이며, 최종 의사결정은 이용자의 책임입니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">제7조 (준거법 및 관할법원)</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            본 약관의 해석 및 적용에 관하여는 대한민국 법률을 적용하며,
                            서비스 이용과 관련하여 분쟁이 발생한 경우 회사의 본점 소재지를
                            관할하는 법원을 전속 관할법원으로 합니다.
                        </p>
                    </section>

                    <section className="pt-6 border-t border-white/10">
                        <p className="text-sm text-slate-500">
                            시행일: 2024년 12월 1일<br />
                            최종 수정일: 2024년 12월 1일
                        </p>
                    </section>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-white/60 hover:text-primary font-medium transition-colors flex items-center justify-center gap-2">
                        ← 홈으로 돌아가기
                    </Link>
                </div>
            </main>
        </div>
    );
}
