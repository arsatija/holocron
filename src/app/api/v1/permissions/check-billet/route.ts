import { NextRequest, NextResponse } from "next/server";
import { getBilletHierarchyChain } from "@/services/permissions";

export async function POST(request: NextRequest) {
    try {
        const { userBilletSlug, requiredPermission } = await request.json();

        if (!userBilletSlug || !requiredPermission) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Get the hierarchy chain for the required permission
        const hierarchyChain = await getBilletHierarchyChain(
            requiredPermission
        );

        // Check if user's billet slug is in the hierarchy chain
        // This allows superiors to access subordinate resources
        const hasAccess = hierarchyChain.includes(userBilletSlug);

        return NextResponse.json({ hasAccess });
    } catch (error) {
        console.error("Error checking billet permission:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
