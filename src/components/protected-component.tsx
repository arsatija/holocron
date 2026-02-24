"use client";

import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";

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

    // Use the new permission check that handles rank, departments, billets, and positions
    const isAllowed = checkPermissionsSync(
        controller.trooperCtx,
        allowedPermissions
    );

    return isAllowed ? <>{children}</> : <>{fallback}</>;
}
