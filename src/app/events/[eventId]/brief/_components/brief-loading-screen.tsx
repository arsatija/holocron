"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface BriefLoadingScreenProps {
    onComplete: () => void;
}

const FULL_TEXT = "DECRYPTING CLASSIFIED OPERATION BRIEF";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function BriefLoadingScreen({ onComplete }: BriefLoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [decryptText, setDecryptText] = useState(FULL_TEXT.replace(/./g, CHARS[0]));

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 2;
            });
        }, 60);

        let iteration = 0;
        const textInterval = setInterval(() => {
            setDecryptText(
                FULL_TEXT.split("")
                    .map((char, index) => {
                        if (char === " ") return " ";
                        if (index < iteration) return FULL_TEXT[index];
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    })
                    .join("")
            );
            if (iteration >= FULL_TEXT.length) clearInterval(textInterval);
            iteration += 1 / 3;
        }, 30);

        const timer = setTimeout(onComplete, 4000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(153,53,52,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(153,53,52,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
                }}
            />

            {/* Scanning line */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(to bottom, transparent, rgba(153,53,52,0.04), transparent)",
                    height: "30%",
                }}
                animate={{ y: ["0%", "340%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 space-y-8 flex flex-col items-center">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-1"
                >
                    <div className="font-mono text-4xl font-black tracking-widest text-[#993534]"
                        style={{ textShadow: "0 0 20px rgba(153,53,52,0.6)" }}
                    >
                        9TH ASSAULT CORPS
                    </div>
                    <div className="font-mono text-xs tracking-[0.5em] text-zinc-500">
                        SECURE OPERATIONS NETWORK
                    </div>
                </motion.div>

                {/* Decryption text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center"
                >
                    <div className="font-mono text-sm tracking-[0.2em] text-[#993534]/80"
                        style={{ textShadow: "0 0 8px rgba(153,53,52,0.4)" }}
                    >
                        {decryptText}
                    </div>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-96 space-y-2"
                >
                    <div className="h-1.5 overflow-hidden border border-[#993534]/40 bg-zinc-900">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#7a1f1f] to-[#993534]"
                            style={{
                                width: `${progress}%`,
                                boxShadow: "0 0 10px rgba(153,53,52,0.6)",
                            }}
                        />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-zinc-600">
                        <span>LOADING...</span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                </motion.div>
            </div>

            {/* Corner decorations */}
            <div className="absolute left-8 top-8 font-mono text-[11px] text-[#993534]/50">[CLASSIFIED]</div>
            <div className="absolute right-8 top-8 font-mono text-[11px] text-[#993534]/50">[SEC: TOP SECRET]</div>
            <div className="absolute bottom-8 left-8 font-mono text-[11px] text-zinc-700">ACCESS GRANTED</div>
            <div className="absolute bottom-8 right-8 font-mono text-[11px] text-zinc-700">
                {new Date().toISOString().split("T")[0]}
            </div>
        </motion.div>
    );
}
