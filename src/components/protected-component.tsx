"use client";

import { useController } from "@/contexts/controller";

interface ProtectedComponentProps {
    children: React.ReactNode;
    allowedPermissions: string[];
    fallback?: React.ReactNode; // Optional fallback component to show if not authorized
}

export function ProtectedComponent({
    children,
    allowedPermissions = [],
    fallback = null,
}: ProtectedComponentProps) {
    const controller = useController();

    // If no permissions are required, show the component
    if (allowedPermissions.length === 0) {
        return <>{children}</>;
    }

    if (!controller?.trooperCtx) {
        return <>{fallback}</>;
    }

    const isRankLevelAllowed = allowedPermissions.includes(
        controller.trooperCtx.rankLevel
    );
    const isScopeAllowed = controller.trooperCtx.departments.some((scope) =>
        allowedPermissions.includes(scope)
    );
    const isAllowed = isRankLevelAllowed || isScopeAllowed;

    return isAllowed ? <>{children}</> : <>{fallback}</>;
}
