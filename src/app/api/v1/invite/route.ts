import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/api-auth";

const INVITE_PERMISSIONS = ["Admin", "JNCO", "SNCO", "Company", "Command"];

export async function POST(req: NextRequest) {
    const denied = await requirePermission(INVITE_PERMISSIONS);
    if (denied) return denied;

    try {
        const body = await req.json();
        const { trooperId } = body;

        if (!trooperId) {
            return NextResponse.json(
                { error: "Trooper ID is required" },
                { status: 400 }
            );
        }

        const existingInvite = await db.query.invites.findFirst({
            where: eq(invites.trooperId, trooperId),
        });

        if (existingInvite) {
            if (
                existingInvite.expiresAt &&
                existingInvite.expiresAt > new Date()
            ) {
                const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${existingInvite.code}`;
                return NextResponse.json({ inviteLink }, { status: 200 });
            }

            await db.delete(invites).where(eq(invites.id, existingInvite.id));
        }

        const inviteCode = nanoid();

        const [invite] = await db
            .insert(invites)
            .values({
                code: inviteCode,
                trooperId,
                expiresAt: addDays(new Date(), 7),
            })
            .returning();

        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite/${invite.code}`;
        return NextResponse.json({ inviteLink }, { status: 201 });
    } catch (error) {
        console.error("Error generating invite:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
