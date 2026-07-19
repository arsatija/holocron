import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getTrooperByAccount } from "@/services/users";
import { buildTrooperCtx } from "@/services/trooper-ctx";

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user?.name) {
            return NextResponse.json(null);
        }

        // Get user and associated trooper data
        const user = await getTrooperByAccount(session?.user?.name || "");
        if (user) {
            const trooperCtx = await buildTrooperCtx(user.trooperId);
            return NextResponse.json(trooperCtx);
        }
        return NextResponse.json(null);
    } catch (error) {
        console.error("Error in trooper route:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
