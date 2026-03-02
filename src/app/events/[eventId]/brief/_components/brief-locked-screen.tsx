"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

export function BriefLockedScreen({ eventId }: { eventId: string }) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            {/* Grid overlay */}
            <div
                className="fixed inset-0 opacity-[0.035] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(153,53,52,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(153,53,52,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: "50px 50px",
                }}
            />

            {/* Scanning line */}
            <motion.div
                className="fixed inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#993534]/15 to-transparent pointer-events-none z-20"
                animate={{ y: ["0vh", "100vh"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Classification banner */}
            <div className="bg-[#7a1f1f] py-1.5 text-center sticky top-0 z-10">
                <p className="text-[11px] font-mono font-bold tracking-[0.4em] uppercase text-zinc-100 flex items-center justify-center gap-2">
                    <Lock className="h-3 w-3 shrink-0" />
                    CLASSIFIED — FOR INTERNAL USE ONLY — 9TH ASSAULT CORPS
                    <Lock className="h-3 w-3 shrink-0" />
                </p>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl flex-1">
                <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors font-mono mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Events
                </Link>

                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                    {/* Pulsing shield */}
                    <motion.div
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                    >
                        <div className="absolute inset-0 rounded-full bg-[#993534]/20 blur-2xl scale-150" />
                        <ShieldAlert className="relative h-20 w-20 text-[#993534]" strokeWidth={1.5} />
                    </motion.div>

                    {/* Heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-3"
                    >
                        <p className="font-mono text-xs tracking-[0.5em] text-[#993534] uppercase">
                            9th Assault Corps // Encrypted Channel
                        </p>
                        <h1
                            className="text-4xl font-black tracking-tight text-zinc-100 uppercase"
                            style={{ textShadow: "0 0 40px rgba(153,53,52,0.4)" }}
                        >
                            Transmission Locked
                        </h1>
                        <p className="font-mono text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                            This operation brief has not yet been cleared for distribution.
                            Access is restricted to authorised personnel only.
                        </p>
                    </motion.div>

                    {/* Encrypted ref block */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="border border-[#993534]/20 rounded-sm px-6 py-4 bg-zinc-900/60 font-mono text-xs text-zinc-600 space-y-1"
                    >
                        <p>REF: {eventId.slice(0, 8).toUpperCase()} — PENDING CLEARANCE</p>
                        <p>SEC: CONFIDENTIAL // ACCESS: DENIED</p>
                        <motion.p
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 2.6, repeat: Infinity }}
                        >
                            AWAITING TRANSMISSION AUTHORISATION_
                        </motion.p>
                    </motion.div>
                </div>

                {/* Footer ref */}
                <div className="mt-4 pt-6 border-t border-[#993534]/20 flex items-center justify-between font-mono text-[11px] text-zinc-700">
                    <span>REF: {eventId.slice(0, 8).toUpperCase()}</span>
                    <span>9TH ASSAULT CORPS // INTERNAL USE ONLY</span>
                </div>
            </div>

            {/* Bottom banner */}
            <div className="bg-[#7a1f1f] py-1.5 text-center mt-4">
                <p className="text-[11px] font-mono font-bold tracking-[0.4em] uppercase text-zinc-100 flex items-center justify-center gap-2">
                    <Lock className="h-3 w-3 shrink-0" />
                    CLASSIFIED — FOR INTERNAL USE ONLY — 9TH ASSAULT CORPS
                    <Lock className="h-3 w-3 shrink-0" />
                </p>
            </div>
        </div>
    );
}
