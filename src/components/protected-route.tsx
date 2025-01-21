"use client";

import Loading from "@/app/loading";
import { useController } from "@/contexts/controller";
import { RankLevel } from "@/db/schema";
import { redirect } from "next/navigation";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedPermissions: string[];
}

export function ProtectedRoute({
    children,
    allowedPermissions = [],
}: ProtectedRouteProps) {
    const controller = useController();

    if (controller?.isLoading) {
        return <Loading />;
    }

    if (!controller?.trooperCtx) {
        console.log("redirecting to login");
        redirect(
            "/login?message=You must have sufficient permission in order to access this page."
        );
        return null;
    }

    if (allowedPermissions.length === 0) {
        return <>{children}</>;
    }

    const isRankLevelAllowed = !allowedPermissions.includes(
        controller.trooperCtx.rankLevel
    );
    const isScopeAllowed = !controller.trooperCtx.scopes.some((scope) =>
        allowedPermissions.includes(scope)
    );
    const isAllowed = isRankLevelAllowed || isScopeAllowed;

    if (!isAllowed) {
        console.log("redirecting to home");
        redirect("/"); // Redirect to home page if permissions aren't sufficient
        return null;
    }

    return <>{children}</>;
}
