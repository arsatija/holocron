"use client";

import { useState, useRef } from "react";
import { ChevronLeft, Shield, Target, Eye, Heart, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ElementLeader {
    trooperName: string;
    trooperNumbers: number;
    rankAbbr: string | null;
    billetRole: string;
}

interface SubUnit {
    name: string;
    description: string;
    expertise: string[];
}

interface ElementDef {
    key: string;
    gridArea: string;
    tagline: string;
    description: string;
    expertise: string[];
    icon: React.ElementType;
    subUnits?: SubUnit[];
}

interface CardRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

// ─── Static element definitions ──────────────────────────────────────────────

const ELEMENTS: ElementDef[] = [
    {
        key: "Myth HQ",
        gridArea: "myth",
        tagline: "Command & Control",
        description:
            "The command element of the 9th Assault Corps, responsible for overall unit direction, inter-element coordination, and strategic planning. Myth provides the backbone of command and control that enables all subordinate elements to operate effectively across the battlespace.",
        expertise: [
            "Command & Control",
            "Strategic Planning",
            "Administration",
            "Inter-unit Liaison",
            "Operational Oversight",
        ],
        icon: Shield,
    },
    {
        key: "Stryx",
        gridArea: "stryx",
        tagline: "Reconnaissance & Intelligence",
        description:
            "The intelligence and reconnaissance element of the 9th Assault Corps. Stryx operates ahead of the main force, gathering battlefield intelligence, identifying high-value targets, and shaping the conditions for success. Expert in covert insertion and long-range observation.",
        expertise: [
            "Reconnaissance",
            "Intelligence Gathering",
            "Long-range Surveillance",
            "Covert Insertion",
            "Target Designation",
        ],
        icon: Eye,
    },
    {
        key: "Apollo",
        gridArea: "apollo",
        tagline: "Medical & Logistics",
        description:
            "The medical and logistics element ensuring operational readiness across the entire 9th Assault Corps. Apollo provides combat medical support, casualty evacuation, and supply chain management to sustain the unit through extended operations.",
        expertise: [
            "Combat Medicine",
            "CASEVAC",
            "Field Surgery",
            "Logistics",
            "Sustainment Operations",
        ],
        icon: Heart,
    },
    {
        key: "Hydra",
        gridArea: "hydra",
        tagline: "Combined Arms & Rapid Response",
        description:
            "A flexible combined arms element capable of rapid deployment and adaptation across the battlespace. Hydra fills critical operational gaps, reinforces endangered positions, and provides the 9th Assault Corps with a versatile force multiplier.",
        expertise: [
            "Combined Arms",
            "Rapid Deployment",
            "Force Multiplication",
            "Adaptive Operations",
            "Reserve & Exploitation",
        ],
        icon: Zap,
    },
    {
        key: "Cinder",
        gridArea: "cinder",
        tagline: "Primary Assault Element",
        description:
            "The primary combat element of the 9th Assault Corps. Composed of three combat-ready squads, Cinder executes the full spectrum of direct action operations — from precision urban assaults to large-scale combined arms engagements. As the main effort, Cinder leads from the front.",
        expertise: [
            "Direct Action",
            "Urban Warfare",
            "Fire & Maneuver",
            "Combined Arms",
            "Close Quarters Battle",
        ],
        icon: Target,
        subUnits: [
            {
                name: "Cinder 1",
                description:
                    "The lead assault squad, specialising in breaching and close-quarters battle. Cinder 1 is routinely tasked with the most demanding assault objectives and leads the main effort in deliberate attack operations.",
                expertise: ["CQB", "Breaching Operations", "Lead Assault", "Deliberate Attack"],
            },
            {
                name: "Cinder 2",
                description:
                    "The second assault squad, providing fire support and flank coverage during Cinder operations. Cinder 2 excels at establishing suppressive fires and executing flanking manoeuvres to isolate enemy positions.",
                expertise: ["Fire Support", "Flanking Operations", "Suppression", "Isolation"],
            },
            {
                name: "Cinder 3",
                description:
                    "The third assault squad, specialising in mechanised operations and heavy fire support. Cinder 3 provides the armoured backbone and heavy weapons capability that enables Cinder element to engage hardened targets.",
                expertise: [
                    "Mechanised Operations",
                    "Heavy Weapons",
                    "Armoured Support",
                    "Anti-armour",
                ],
            },
        ],
    },
];

// ─── Expertise badges ─────────────────────────────────────────────────────────

function ExpertiseBadges({ items }: { items: string[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <Badge
                    key={item}
                    variant="secondary"
                    className="text-xs border border-[#993534]/30 bg-[#993534]/10 text-foreground"
                >
                    {item}
                </Badge>
            ))}
        </div>
    );
}

// ─── Leader block ─────────────────────────────────────────────────────────────

function LeaderBlock({ leader }: { leader: ElementLeader | undefined }) {
    if (!leader) return null;
    return (
        <div className="pt-5 mt-5 border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Element Commander
            </p>
            <p className="text-sm font-semibold">
                {leader.rankAbbr} {leader.trooperName}{" "}
                <span className="text-muted-foreground font-normal">
                    ({leader.trooperNumbers})
                </span>
            </p>
            <p className="text-xs text-muted-foreground">{leader.billetRole}</p>
        </div>
    );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
    element,
    leader,
    onBack,
}: {
    element: ElementDef;
    leader: ElementLeader | undefined;
    onBack: () => void;
}) {
    const Icon = element.icon;

    return (
        <div className="h-full flex flex-col">
            {/* Back */}
            <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 w-fit"
            >
                <ChevronLeft className="h-4 w-4" />
                All Elements
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-lg bg-[#993534]/10 border border-[#993534]/20 shrink-0">
                    <Icon className="h-7 w-7 text-[#993534]" />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                        {element.tagline}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#993534]">
                        {element.key}
                    </h2>
                </div>
            </div>

            {/* Description — always visible */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {element.description}
            </p>

            {/* Cinder: per-squad tabs */}
            {element.subUnits ? (
                <>
                    <Tabs defaultValue={element.subUnits[0].name}>
                        <TabsList className="mb-4">
                            {element.subUnits.map((su) => (
                                <TabsTrigger key={su.name} value={su.name}>
                                    {su.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {element.subUnits.map((su) => (
                            <TabsContent
                                key={su.name}
                                value={su.name}
                                className="space-y-4 animate-in fade-in duration-150"
                            >
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {su.description}
                                </p>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                        Areas of Expertise
                                    </p>
                                    <ExpertiseBadges items={su.expertise} />
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                    <LeaderBlock leader={leader} />
                </>
            ) : (
                <div className="space-y-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                            Areas of Expertise
                        </p>
                        <ExpertiseBadges items={element.expertise} />
                    </div>
                    <LeaderBlock leader={leader} />
                </div>
            )}
        </div>
    );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function ElementCard({
    element,
    onCardClick,
    style,
    className,
}: {
    element: ElementDef;
    onCardClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    style?: React.CSSProperties;
    className?: string;
}) {
    const Icon = element.icon;
    const isCinder = element.key === "Cinder";

    return (
        <button
            onClick={onCardClick}
            style={style}
            className={cn(
                "group relative flex flex-col justify-between p-5 bg-card text-left overflow-hidden",
                "hover:bg-accent/60 transition-colors duration-200 cursor-pointer",
                className
            )}
        >
            {/* Red grid bleeds in from corner on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                    maskImage:
                        "radial-gradient(ellipse 100% 100% at 0% 100%, black 0%, transparent 65%)",
                    WebkitMaskImage:
                        "radial-gradient(ellipse 100% 100% at 0% 100%, black 0%, transparent 65%)",
                }}
            />

            {/* Icon */}
            <div
                className={cn(
                    "p-2.5 rounded-lg bg-muted w-fit transition-colors duration-200 group-hover:bg-[#993534]/10",
                    isCinder && "p-3"
                )}
            >
                <Icon
                    className={cn(
                        "text-muted-foreground transition-colors duration-200 group-hover:text-[#993534]",
                        isCinder ? "h-9 w-9" : "h-5 w-5"
                    )}
                />
            </div>

            {/* Name + tagline */}
            <div>
                <p
                    className={cn(
                        "font-extrabold tracking-tight text-foreground transition-colors duration-200 group-hover:text-[#993534]",
                        isCinder ? "text-3xl md:text-4xl" : "text-base md:text-lg"
                    )}
                >
                    {element.key}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {element.tagline}
                </p>
                {isCinder && (
                    <p className="text-xs text-[#993534]/70 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        3 squads · tap to explore →
                    </p>
                )}
            </div>
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UnitGrid({ leaders }: { leaders: Record<string, ElementLeader> }) {
    const containerRef = useRef<HTMLDivElement>(null);

    // What element is selected
    const [selected, setSelected] = useState<ElementDef | null>(null);
    // Starting rect for the expand animation (relative to container)
    const [originRect, setOriginRect] = useState<CardRect | null>(null);
    // Whether the overlay has expanded to full size
    const [expanded, setExpanded] = useState(false);
    // Whether the detail content is visible (fades in after card finishes expanding)
    const [contentVisible, setContentVisible] = useState(false);

    const handleCardClick = (element: ElementDef, e: React.MouseEvent<HTMLButtonElement>) => {
        const container = containerRef.current;
        if (!container) return;

        // Measure where the card is relative to the container
        const cr = container.getBoundingClientRect();
        const br = e.currentTarget.getBoundingClientRect();

        setOriginRect({
            top: br.top - cr.top,
            left: br.left - cr.left,
            width: br.width,
            height: br.height,
        });
        setSelected(element);
        setExpanded(false);
        setContentVisible(false);

        // Two rAFs: first lets React render the overlay at origin position,
        // second triggers the CSS transition to full size.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setExpanded(true);
                // Fade in content once the card is mostly expanded
                setTimeout(() => setContentVisible(true), 280);
            });
        });
    };

    const handleBack = () => {
        // Fade out content first, then shrink overlay back
        setContentVisible(false);
        setTimeout(() => {
            setExpanded(false);
            // After shrink animation completes, remove overlay entirely
            setTimeout(() => {
                setSelected(null);
                setOriginRect(null);
            }, 380);
        }, 150);
    };

    // Grid layout shared between desktop and mobile renders
    const gridCards = (elements: ElementDef[], extraClass?: (el: ElementDef) => string) =>
        elements.map((el) => (
            <ElementCard
                key={el.key}
                element={el}
                onCardClick={(e) => handleCardClick(el, e)}
                style={{ gridArea: el.gridArea }}
                className={extraClass?.(el)}
            />
        ));

    return (
        /*
         * Container is `relative overflow-hidden rounded-xl` so:
         *  - The 2px bg-border gaps read as seams between flush cells
         *  - The expanding overlay is clipped by the container's border-radius
         *  - The overlay never escapes the collage bounds
         */
        <div ref={containerRef} className="relative rounded-xl overflow-hidden bg-border">

            {/* ── Desktop collage: Mondrian layout ───────────────────────── */}
            {/*
             *  col widths : 1.7fr  1fr   1fr   (Cinder left column, widest)
             *  row heights: 1.6fr 1.4fr 1fr
             *
             *  CINDER | myth   | stryx
             *  CINDER | apollo | stryx
             *  CINDER | apollo | hydra
             */}
            <div
                className="hidden lg:grid"
                style={{
                    gap: "2px",
                    gridTemplateColumns: "1.7fr 1fr 1fr",
                    gridTemplateRows: "1.6fr 1.4fr 1fr",
                    gridTemplateAreas: `
                        "cinder myth   stryx"
                        "cinder apollo stryx"
                        "cinder apollo hydra"
                    `,
                    minHeight: "500px",
                }}
            >
                {gridCards(ELEMENTS)}
            </div>

            {/* ── Mobile collage: 2-col, Cinder full-width on top ────────── */}
            <div
                className="grid grid-cols-2 lg:hidden"
                style={{ gap: "2px", minHeight: "420px" }}
            >
                {gridCards(
                    [
                        ELEMENTS.find((e) => e.key === "Cinder")!,
                        ...ELEMENTS.filter((e) => e.key !== "Cinder"),
                    ],
                    (el) => (el.key === "Cinder" ? "col-span-2" : "")
                )}
            </div>

            {/* ── Expanding overlay ───────────────────────────────────────── */}
            {selected && originRect && (
                <div
                    className="absolute z-10 bg-card overflow-y-auto"
                    style={{
                        // Transition: top/left/width/height animate the card-to-full expand
                        transition:
                            "top 350ms cubic-bezier(0.4,0,0.2,1), left 350ms cubic-bezier(0.4,0,0.2,1), width 350ms cubic-bezier(0.4,0,0.2,1), height 350ms cubic-bezier(0.4,0,0.2,1)",
                        ...(expanded
                            ? { top: 0, left: 0, width: "100%", height: "100%" }
                            : {
                                  top: originRect.top,
                                  left: originRect.left,
                                  width: originRect.width,
                                  height: originRect.height,
                              }),
                    }}
                >
                    {/* Detail content fades in after the card finishes expanding */}
                    <div
                        className="p-6 md:p-8 min-h-full transition-opacity duration-200"
                        style={{ opacity: contentVisible ? 1 : 0 }}
                    >
                        <DetailPanel
                            element={selected}
                            leader={leaders[selected.key]}
                            onBack={handleBack}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
