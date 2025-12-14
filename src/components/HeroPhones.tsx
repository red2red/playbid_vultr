"use client";

import Image from "next/image";
import { Icon } from "@iconify/react";

export function HeroPhones() {
    return (
        <div className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[600px] mt-10 perspective-2000">
            {/* Left Phone */}
            <div
                className="absolute top-10 left-1/2 -translate-x-[110%] w-[240px] md:w-[280px] h-auto transition-transform duration-700 hover:-translate-y-4 z-10"
                style={{ transform: 'translateX(-110%) rotateY(15deg) rotateZ(-2deg) scale(0.9)', transformOrigin: 'center right' }}
            >
                <div className="relative rounded-[2.5rem] overflow-hidden border-[8px] border-slate-900 shadow-2xl bg-slate-900">
                    <Image
                        src="/hero_app_screen.png"
                        alt="App Screen Left"
                        width={300}
                        height={650}
                        className="w-full h-auto object-cover opacity-80"
                    />
                    {/* Overlay to dim slightly */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                </div>
            </div>

            {/* Right Phone */}
            <div
                className="absolute top-10 left-1/2 translate-x-[10%] w-[240px] md:w-[280px] h-auto transition-transform duration-700 hover:-translate-y-4 z-10"
                style={{ transform: 'translateX(10%) rotateY(-15deg) rotateZ(2deg) scale(0.9)', transformOrigin: 'center left' }}
            >
                <div className="relative rounded-[2.5rem] overflow-hidden border-[8px] border-slate-900 shadow-2xl bg-slate-900">
                    <Image
                        src="/hero_app_screen.png"
                        alt="App Screen Right"
                        width={300}
                        height={650}
                        className="w-full h-auto object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                </div>
            </div>

            {/* Center Phone (Front) */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[260px] md:w-[320px] h-auto z-20 transition-transform duration-500 hover:scale-105"
            >
                {/* Glow behind center phone */}
                <div className="absolute -inset-4 bg-blue-500/30 blur-3xl rounded-full" />

                <div className="relative rounded-[3rem] overflow-hidden border-[10px] border-slate-900 shadow-2xl bg-slate-900">
                    <Image
                        src="/hero_app_screen.png"
                        alt="App Screen Center"
                        width={320}
                        height={690}
                        className="w-full h-auto object-cover"
                        priority
                    />
                    {/* Glare effect */}
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                </div>

                {/* Floating Badge on phone */}
                <div className="absolute bottom-12 -right-6 md:-right-12 bg-white/90 backdrop-blur border border-white/20 p-3 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                            <Icon icon="solar:rocket-2-bold-duotone" className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold">Success Rate</div>
                            <div className="text-slate-900 font-black text-lg">98.5%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
