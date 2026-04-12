import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function HeroBanner() {
    return (
        // bg-background = white in light mode, near-black in dark mode
        <div className="relative w-full bg-background border-b border-border overflow-hidden">

            {/* 9th red grid — radial fade from center outward */}
            <div
                className="absolute inset-0 opacity-[0.12] dark:opacity-[0.35]"
                style={{
                    backgroundImage:
                        "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage:
                        "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 85% 100% at 50% 50%, black 0%, black 25%, transparent 80%)",
                }}
            />

            <div className="relative container mx-auto px-4 py-12 md:py-16 flex flex-col items-center text-center gap-5">
                <Image
                    src="/images/9_logo.png"
                    alt="9th Assault Corps Crest"
                    width={96}
                    height={96}
                    className="drop-shadow-lg"
                    priority
                />
                <div>
                    <p className="text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-2">
                        ARMA 3 · Milsim Unit
                    </p>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground drop-shadow">
                        9th Assault Corps
                    </h1>
                    <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
                        Unit command center — roster, operations, campaigns, and more.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Link href="/unit">
                        <Button variant="outline">
                            Who We Are <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/offerings">
                        <Button variant="outline">
                            What We Offer <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
