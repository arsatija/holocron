"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface BriefLoadingScreenProps {
    onComplete: () => void;
    mode?: "success" | "denied";
}

const SUCCESS_TEXT = "DECRYPTING CLASSIFIED OPERATION BRIEF";
const FAIL_TEXT    = "DECRYPTION FAILED \u2014 CLEARANCE DENIED";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

export function BriefLoadingScreen({ onComplete, mode = "success" }: BriefLoadingScreenProps) {
    const [progress, setProgress] = useState(0);
    const [decryptText, setDecryptText] = useState(SUCCESS_TEXT.replace(/[^ ]/g, CHARS[0]));
    const [failed, setFailed] = useState(false);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        const STOP_AT = mode === "denied"
            ? Math.floor(Math.random() * (86 - 72 + 1)) + 72
            : 100;

        // Progress bar
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + 2;
                if (next >= STOP_AT) {
                    clearInterval(progressInterval);
                    return STOP_AT;
                }
                return next;
            });
        }, 60);

        // Initial scramble to SUCCESS_TEXT
        let iteration = 0;
        const textInterval = setInterval(() => {
            setDecryptText(
                SUCCESS_TEXT.split("").map((char, index) => {
                    if (char === " ") return " ";
                    if (index < iteration) return SUCCESS_TEXT[index];
                    return CHARS[Math.floor(Math.random() * CHARS.length)];
                }).join("")
            );
            if (iteration >= SUCCESS_TEXT.length) clearInterval(textInterval);
            iteration += 1 / 3;
        }, 30);

        // Failure sequence (denied mode only)
        let failTimer: ReturnType<typeof setTimeout> | null = null;
        if (mode === "denied") {
            failTimer = setTimeout(() => {
                clearInterval(textInterval);
                setFailed(true);
                setFlash(true);
                setTimeout(() => setFlash(false), 450);

                // Scramble to FAIL_TEXT
                let failIteration = 0;
                const failTextInterval = setInterval(() => {
                    setDecryptText(
                        FAIL_TEXT.split("").map((char, index) => {
                            if (char === " " || char === "\u2014") return char;
                            if (index < failIteration) return FAIL_TEXT[index];
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        }).join("")
                    );
                    if (failIteration >= FAIL_TEXT.length) clearInterval(failTextInterval);
                    failIteration += 1 / 3;
                }, 30);
            }, 2300);
        }

        const timeout = mode === "denied" ? 6000 : 4000;
        const completeTimer = setTimeout(onComplete, timeout);

        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
            if (failTimer) clearTimeout(failTimer);
            clearTimeout(completeTimer);
        };
    }, []);  // intentionally no deps — mode and onComplete are stable refs captured at mount

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Red flash overlay on failure */}
            <AnimatePresence>
                {flash && (
                    <motion.div
                        key="flash"
                        className="absolute inset-0 bg-red-900/25 z-20 pointer-events-none"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.45 }}
                    />
                )}
            </AnimatePresence>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(153,53,52,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(153,53,52,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0"
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
                    <div
                        className="font-mono text-4xl font-black tracking-widest text-[#993534]"
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
                    <div
                        className={`font-mono text-sm tracking-[0.2em] transition-colors duration-300 ${failed ? "text-red-500/90" : "text-[#993534]/80"}`}
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
                        <div
                            className={`h-full bg-gradient-to-r transition-colors duration-300 ${failed ? "from-red-900 to-red-600" : "from-[#7a1f1f] to-[#993534]"}`}
                            style={{
                                width: `${progress}%`,
                                boxShadow: failed
                                    ? "0 0 10px rgba(220,38,38,0.6)"
                                    : "0 0 10px rgba(153,53,52,0.6)",
                                transition: "width 60ms linear, background-color 300ms",
                            }}
                        />
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-zinc-600">
                        <span className={`transition-colors duration-300 ${failed ? "text-red-700" : ""}`}>
                            {failed ? "FAILED" : "LOADING..."}
                        </span>
                        <span>{Math.floor(progress)}%</span>
                    </div>
                </motion.div>
            </div>

            {/* Corner decorations */}
            <div className="absolute left-8 top-8 font-mono text-[11px] text-[#993534]/50">[CLASSIFIED]</div>
            <div className="absolute right-8 top-8 font-mono text-[11px] text-[#993534]/50">[SEC: TOP SECRET]</div>
            <div className={`absolute bottom-8 left-8 font-mono text-[11px] transition-colors duration-300 ${failed ? "text-red-700" : "text-zinc-700"}`}>
                {failed ? "ACCESS DENIED" : "ACCESS GRANTED"}
            </div>
            <div className="absolute bottom-8 right-8 font-mono text-[11px] text-zinc-700">
                {new Date().toISOString().split("T")[0]}
            </div>
        </motion.div>
    );
}
