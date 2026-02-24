import { NextRequest, NextResponse } from "next/server";
import { getPositionHierarchyChain } from "@/services/permissions";

export async function POST(request: NextRequest) {
    try {
        const { userPositionSlug, requiredPermission } = await request.json();

        if (!userPositionSlug || !requiredPermission) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Get the hierarchy chain for the required permission
        const hierarchyChain = await getPositionHierarchyChain(
            requiredPermission
        );

        // Check if user's position slug is in the hierarchy chain
        // This allows superiors to access subordinate resources
        const hasAccess = hierarchyChain.includes(userPositionSlug);

        return NextResponse.json({ hasAccess });
    } catch (error) {
        console.error("Error checking position permission:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
