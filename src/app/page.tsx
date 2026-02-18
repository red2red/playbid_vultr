import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { GooglePlayIcon, AppleLogoIcon } from "@/components/ui/StoreIcons";
import { MeshGradientBackground } from "@/components/MeshGradientBackground";
import { HeroPhones } from "@/components/HeroPhones";
import { Icon } from "@iconify/react";
import { FadeIn, StaggerContainer, FadeInStaggerItem, ScaleIn } from "@/components/ui/Motion";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MeshGradientBackground />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <Container className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 relative flex items-center justify-center transition-transform group-hover:scale-95 group-hover:rotate-3">
              <Image src="/logo.png" alt="PlayBid Logo" width={40} height={40} className="object-contain brightness-0 invert" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">PlayBid</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="#features" className="hidden md:block text-sm font-semibold text-muted-foreground hover:text-foreground transition">
              기능
            </Link>
            <Link href="#how-it-works" className="hidden md:block text-sm font-semibold text-muted-foreground hover:text-foreground transition">
              사용방법
            </Link>
            <Button size="sm" href="#download" className="bg-primary hover:bg-blue-600 text-white border-none shadow-lg shadow-blue-500/20">
              앱 다운로드
            </Button>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-10 md:pt-48 md:pb-20 overflow-hidden relative z-10">
        <Container className="text-center">
          <FadeIn delay={0.1}>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-6 backdrop-blur-md">
              나라장터 모의입찰 플랫폼
            </Badge>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-8 text-balance leading-[1.05]">
              Play Smart, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-amber-400">
                Bid Right!
              </span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
              복잡한 공공입찰을 게임처럼 쉽고 재미있게 배우세요. <br />
              AI 분석 데이터로 낙찰 확률을 극대화합니다.
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" href="#download" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 border-none transition-all hover:scale-105 active:scale-95">
                무료로 시작하기
              </Button>
              <Button size="lg" variant="outline" href="#features" className="text-white border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-md">
                자세히 알아보기
              </Button>
            </div>
          </FadeIn>

          {/* Stats Row */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">10,000+</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">98%</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">4.9/5</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">App Rating</div>
              </div>
            </div>
          </FadeIn>

          {/* 3-Phone Composition */}
          <FadeIn delay={0.6} direction="up" duration={0.8}>
            <HeroPhones />
          </FadeIn>

        </Container>
      </section>

      {/* Philosophy / Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80 pointer-events-none" />
        <Container>
          <SectionHeader
            title="We know what works."
            subtitle="PlayBid는 단순한 공고 알림 앱이 아닙니다. 행동 경제학(Gamification)과 데이터 과학을 결합한 입찰 훈련 시스템입니다."
            className="text-white"
          />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl mx-auto">
            {/* Card 1 */}
            <FadeInStaggerItem className="bg-card/50 p-6 rounded-3xl border border-white/10 shadow-lg shadow-black/20 hover:shadow-blue-900/10 transition-all backdrop-blur-md flex items-center gap-6 text-left transform hover:-translate-y-1 duration-300">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                <Icon icon="solar:chart-square-bold-duotone" className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">AI 예측 분석</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  수년간의 입찰 데이터를 학습한 AI가 최적의 투찰 금액 범위를 제안합니다.
                </p>
              </div>
            </FadeInStaggerItem>
            {/* Card 2 */}
            <FadeInStaggerItem className="bg-card/50 p-6 rounded-3xl border border-white/10 shadow-lg shadow-black/20 hover:shadow-amber-900/10 transition-all backdrop-blur-md flex items-center gap-6 text-left transform hover:-translate-y-1 duration-300">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
                <Icon icon="solar:gamepad-bold-duotone" className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">게이미피케이션</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  XP, 레벨, 랭킹 시스템을 통해 지루한 입찰 업무를 게임처럼 즐기세요.
                </p>
              </div>
            </FadeInStaggerItem>
            {/* Card 3 */}
            <FadeInStaggerItem className="bg-card/50 p-6 rounded-3xl border border-white/10 shadow-lg shadow-black/20 hover:shadow-green-900/10 transition-all backdrop-blur-md flex items-center gap-6 text-left transform hover:-translate-y-1 duration-300">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-green-500/20">
                <Icon icon="solar:book-bookmark-bold-duotone" className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">마이크로 러닝</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  매일 5분, 퀴즈와 플래시카드로 입찰 전문 지식을 습득하세요.
                </p>
              </div>
            </FadeInStaggerItem>
          </StaggerContainer>
        </Container>
      </section>

      {/* How it Works - Alternating */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <Container>
          <SectionHeader title="Your Journey to Winning." className="text-white" />

          <div className="space-y-24">
            {/* Step 1 */}
            <FadeIn>
              <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1 order-2 md:order-1">
                  {/* Step 1 Social Stack */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-500 bg-card p-6 flex flex-col gap-3 items-stretch justify-center aspect-[4/3]">

                    {/* Apple */}
                    <div className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl font-bold hover:opacity-90 transition cursor-pointer border border-white/10">
                      <Image src="/social/apple.png" alt="Apple" width={24} height={24} className="object-contain invert" />
                      <span className="flex-1 text-center text-sm">Apple로 계속하기</span>
                    </div>

                    {/* Google */}
                    <div className="flex items-center gap-3 bg-white text-slate-700 px-4 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                      <Image src="/social/google.png" alt="Google" width={24} height={24} className="object-contain" />
                      <span className="flex-1 text-center text-sm">Google로 계속하기</span>
                    </div>

                    {/* Kakao */}
                    <div className="flex items-center gap-3 bg-[#FAE100] text-[#371D1E] px-4 py-3 rounded-xl font-bold hover:bg-[#FDD835] transition cursor-pointer">
                      <Image src="/social/kakao.png" alt="Kakao" width={24} height={24} className="object-contain" />
                      <span className="flex-1 text-center text-sm">카카오로 계속하기</span>
                    </div>

                    {/* Naver */}
                    <div className="flex items-center gap-3 bg-[#03C75A] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#02b351] transition cursor-pointer">
                      <Image src="/social/naver.png" alt="Naver" width={24} height={24} className="object-contain" />
                      <span className="flex-1 text-center text-sm">네이버로 계속하기</span>
                    </div>

                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30">Step 1</Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">3초 회원가입</h3>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                    복잡한 절차 없이 소셜 로그인으로 즉시 시작하세요.
                    관심 지역과 업종만 설정하면 맞춤 공고가 쏟아집니다.
                  </p>
                  <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">가입하기</Button>
                </div>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={0.1}>
              <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1">
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30">Step 2</Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">모의 입찰 훈련</h3>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                    실제 공고와 동일한 환경에서 리스크 없이 입찰을 연습하세요.
                    AI가 분석한 투찰 금액을 참고하여 전략을 수립할 수 있습니다.
                  </p>
                </div>
                <div className="flex-1">
                  {/* Step 2 Image */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 transform -rotate-1 hover:rotate-0 transition-transform duration-500 bg-card">
                    <Image
                      src="/step2_training.jpg"
                      alt="Mock Training"
                      width={500}
                      height={375}
                      className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={0.1}>
              <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="flex-1 order-2 md:order-1">
                  {/* Step 3 Image */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 transform rotate-1 hover:rotate-0 transition-transform duration-500 bg-card">
                    <Image
                      src="/step3_analysis.jpg"
                      alt="Data Analysis"
                      width={500}
                      height={375}
                      className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2">
                  <Badge variant="outline" className="text-green-400 border-green-500/30">Step 3</Badge>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">결과 분석 및 성장</h3>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                    낙찰 결과를 확인하고 나의 예측이 얼마나 정확했는지 분석합니다.
                    경험치를 얻어 레벨을 올리고 전문가 랭킹에 도전하세요.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-32 bg-slate-900 text-white text-center">
        <Container>
          <ScaleIn>
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Ready to Win?</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              지금 바로 PlayBid를 시작하고 입찰 전문가로 성장하세요. <br />
              100% 무료로 시작할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#" className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-50 transition-transform hover:scale-105 active:scale-95 shadow-lg">
                <GooglePlayIcon className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-500">GET IT ON</div>
                  <div className="text-xl leading-none">Google Play</div>
                </div>
              </Link>
              <Link href="#" className="flex items-center gap-3 bg-slate-900 border border-slate-700 text-white px-8 py-4 rounded-full font-bold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-lg">
                <AppleLogoIcon className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs font-medium text-slate-400">Download on the</div>
                  <div className="text-xl leading-none">App Store</div>
                </div>
              </Link>
            </div>
          </ScaleIn>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background/90 border-t border-white/5 backdrop-blur-md">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 relative flex items-center justify-center">
                <Image src="/logo.png" alt="PlayBid Logo" width={32} height={32} className="object-contain brightness-0 invert" />
              </div>
              <span className="font-bold text-foreground text-lg">PlayBid</span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground font-medium">
              <Link href="/terms" className="hover:text-primary transition flex items-center gap-1.5">
                <Icon icon="solar:file-text-bold-duotone" className="w-4 h-4" />
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-primary transition flex items-center gap-1.5">
                <Icon icon="solar:shield-check-bold-duotone" className="w-4 h-4" />
                개인정보처리방침
              </Link>
              <a href="mailto:support@playbid.kr" className="hover:text-primary transition flex items-center gap-1.5">
                <Icon icon="solar:letter-bold-duotone" className="w-4 h-4" />
                문의하기
              </a>
            </div>

            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} PlayBid
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
