import { db } from "@/db";
import { billets, billetAssignments, unitElements, troopers, ranks } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import UnitGrid, { ElementLeader } from "./_components/unit-grid";

const ELEMENT_NAMES = ["Myth HQ", "Cinder", "Stryx", "Apollo", "Hydra"];

async function getElementLeaders(): Promise<Record<string, ElementLeader>> {
    // Fetch all filled billets for our displayed elements, ordered by priority.
    // First result per element = the leader billet.
    const rows = await db
        .select({
            elementName: unitElements.name,
            billetPriority: billets.priority,
            billetRole: billets.role,
            trooperName: troopers.name,
            trooperNumbers: troopers.numbers,
            rankAbbr: ranks.abbreviation,
        })
        .from(unitElements)
        .innerJoin(billets, eq(billets.unitElementId, unitElements.id))
        .innerJoin(billetAssignments, eq(billetAssignments.billetId, billets.id))
        .innerJoin(troopers, eq(troopers.id, billetAssignments.trooperId))
        .leftJoin(ranks, eq(ranks.id, troopers.rank))
        .where(inArray(unitElements.name, ELEMENT_NAMES))
        .orderBy(asc(billets.priority));

    // Take the first (lowest-priority = leader) per element
    const leaders: Record<string, ElementLeader> = {};
    for (const row of rows) {
        if (!leaders[row.elementName]) {
            leaders[row.elementName] = {
                trooperName: row.trooperName,
                trooperNumbers: row.trooperNumbers,
                rankAbbr: row.rankAbbr ?? null,
                billetRole: row.billetRole,
            };
        }
    }
    return leaders;
}

export default async function UnitPage() {
    const leaders = await getElementLeaders();

    return (
        <div className="">
            {/* ── Small hero ──────────────────────────────────────────────── */}
            <div className="relative bg-background border-b border-border overflow-hidden py-10">
                {/* 9th red grid, same pattern as main hero but smaller */}
                <div
                    className="absolute inset-0 opacity-[0.1] dark:opacity-[0.28]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#993534 1px, transparent 1px), linear-gradient(90deg, #993534 1px, transparent 1px)",
                        backgroundSize: "48px 48px",
                        maskImage:
                            "radial-gradient(ellipse 90% 100% at 50% 50%, black 0%, black 20%, transparent 80%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse 90% 100% at 50% 50%, black 0%, black 20%, transparent 80%)",
                    }}
                />
                <div className="relative container mx-auto px-4">
                    <p className="text-xs font-semibold tracking-[0.4em] uppercase text-muted-foreground mb-1">
                        9th Assault Corps
                    </p>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase text-[#993534]">
                        Who We Are
                    </h1>
                </div>
            </div>

            {/* ── Element grid ─────────────────────────────────────────────── */}
            <div className="container mx-auto px-4 py-8">
                <UnitGrid leaders={leaders} />
            </div>
        </div>
    );
}
