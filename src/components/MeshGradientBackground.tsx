"use client";

import { motion } from "framer-motion";

export function MeshGradientBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
            {/* Deep Navy Base */}
            <div className="absolute inset-0 bg-slate-950/80" />

            {/* Floating Orbs / Gradients - Dark Premium Theme */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [-20, 20, -20],
                    y: [-20, 20, -20],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
                // Primary Blue Glow (Top Left)
                className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/20 blur-[120px]"
            />

            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.15, 0.3, 0.15],
                    x: [20, -20, 20],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
                // Secondary Gold Glow (Top Right)
                className="absolute top-[20%] right-[0%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-amber-500/20 to-yellow-600/10 blur-[100px]"
            />

            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
                // Bottom Center Glow (Subtle)
                className="absolute -bottom-[20%] left-[20%] w-[70%] h-[60%] rounded-full bg-gradient-to-t from-blue-900/40 via-slate-900/40 to-transparent blur-[120px]"
            />

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
        </div>
    );
}
