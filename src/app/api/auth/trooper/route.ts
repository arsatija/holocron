import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getTrooper } from "@/services/troopers";
import { getTrooperByAccount } from "@/services/users";
import { getFullTrooperName } from "@/lib/utils";
import { getRank } from "@/services/ranks";

export async function GET() {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.name) {
            return NextResponse.json(null);
        }

        // Get user and associated trooper data
        const user = await getTrooperByAccount(
            session?.user?.name || ""
        );
        if (user) {
            const trooper = await getTrooper(user.trooperId);
            if (!trooper) {
                return NextResponse.json(null);
            }

            const trooperName = getFullTrooperName(trooper);
            const rankData = await getRank(trooper.rank);

            const trooperCtx = {
                id: user.trooperId,
                fullName: trooperName,
                rankLevel: rankData?.rankLevel ?? "Enlisted",
                scopes: [],
            };
            return NextResponse.json(trooperCtx);
        }
        return NextResponse.json(null);
    } catch (error) {
        console.error('Error in trooper route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
} 