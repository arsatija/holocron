"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";

interface CampaignLoadingScreenProps {
    onComplete: () => void;
}

const LOAD_TEXT = "INITIALISING CAMPAIGN INTELLIGENCE ARCHIVE";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function CampaignLoadingScreen({ onComplete }: CampaignLoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [displayText, setDisplayText] = useState(LOAD_TEXT.replace(/[^ ]/g, CHARS[0]));
    const [phase, setPhase] = useState<"auth" | "sync" | "ready">("auth");
    const { resolvedTheme } = useTheme();
    const isLight = resolvedTheme === "light";

    useEffect(() => {
        // Progress bar
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + 2;
                if (next >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return next;
            });
        }, 55);

        // Text decrypt
        let iteration = 0;
        const textInterval = setInterval(() => {
            setDisplayText(
                LOAD_TEXT.split("").map((char, index) => {
                    if (char === " ") return " ";
                    if (index < iteration) return LOAD_TEXT[index];
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                }).join("")
            );
            if (iteration >= LOAD_TEXT.length) clearInterval(textInterval);
            iteration += 1 / 3;
        }, 30);

        // Phase transitions
        const t1 = setTimeout(() => setPhase("sync"), 1400);
        const t2 = setTimeout(() => setPhase("ready"), 2800);
        const completeTimer = setTimeout(onComplete, 3800);

        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(completeTimer);
        };
    }, []);

    const phaseLabel = phase === "auth" ? "AUTHENTICATING..." : phase === "sync" ? "SYNCING RECORDS..." : "READY";
    const phaseColor = phase === "ready" ? "text-green-500" : "text-[#993534]/70";

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(153,53,52,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(153,53,52,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: isLight
                        ? "radial-gradient(ellipse at center, transparent 35%, rgba(255,255,255,0.9) 100%)"
                        : "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.9) 100%)",
                }}
            />

            {/* Horizontal sweep line */}
            <motion.div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                    height: "2px",
                    background: "linear-gradient(to right, transparent, rgba(153,53,52,0.5), rgba(153,53,52,0.15), transparent)",
                }}
                animate={{ top: ["10%", "90%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
            />

            <div className="relative z-10 space-y-8 flex flex-col items-center w-full max-w-lg px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-1"
                >
                    <div
                        className="font-mono text-4xl font-black tracking-widest text-[#993534]"
                        style={{ textShadow: isLight ? "0 0 20px rgba(153,53,52,0.3)" : "0 0 20px rgba(153,53,52,0.6)" }}
                    >
                        9TH ASSAULT CORPS
                    </div>
                    <div className="font-mono text-xs tracking-[0.5em] text-zinc-400 dark:text-zinc-500">
                        TACTICAL COMMAND NETWORK
                    </div>
                </motion.div>

                {/* Decrypt text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <div
                        className="font-mono text-sm tracking-[0.2em] text-[#993534]/80"
                        style={{ textShadow: "0 0 8px rgba(153,53,52,0.4)" }}
                    >
                        {displayText}
                    </div>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full space-y-2"
                >
                    <div className="h-1.5 overflow-hidden border border-[#993534]/40 bg-zinc-200 dark:bg-zinc-900">
                        <div
                            className="h-full bg-gradient-to-r from-[#7a1f1f] to-[#993534]"
                            style={{
                                width: `${progress}%`,
                                boxShadow: "0 0 10px rgba(153,53,52,0.6)",
                                transition: "width 55ms linear",
                            }}
                        />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                        <motion.span
                            key={phase}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={phaseColor}
                        >
                            {phaseLabel}
                        </motion.span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                </motion.div>
            </div>

            {/* Corner decorations */}
            <div className="absolute left-8 top-8 font-mono text-[11px] text-[#993534]/50">[CAMPAIGN]</div>
            <div className="absolute right-8 top-8 font-mono text-[11px] text-[#993534]/50">[CMD-NET]</div>
            <div className="absolute bottom-8 left-8 font-mono text-[11px] text-zinc-400 dark:text-zinc-700">
                CLEARANCE: STANDARD
            </div>
            <div className="absolute bottom-8 right-8 font-mono text-[11px] text-zinc-400 dark:text-zinc-700">
                {new Date().toISOString().split("T")[0]}
            </div>
        </motion.div>
    );
}
