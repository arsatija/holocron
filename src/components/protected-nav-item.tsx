import { useContext } from "react";
import { useController } from "@/contexts/controller";
import { RankLevel } from "@/db/schema";
import Link from "next/link";
import { checkPermissionsSync } from "@/lib/permissions";

interface ProtectedNavItemProps {
    href: string;
    allowedPermissions: string[];
    children: React.ReactNode;
}

export function ProtectedNavItem({
    href,
    allowedPermissions,
    children,
}: ProtectedNavItemProps) {
    const controller = useController();

    if (!controller?.trooperCtx) {
        return null;
    }

    if (allowedPermissions.length === 0) {
        return (
            <Link href={href} legacyBehavior passHref>
                {children}
            </Link>
        );
    }

    // Use the new permission check that handles rank, departments, billets, and positions
    const isAllowed = checkPermissionsSync(
        controller.trooperCtx,
        allowedPermissions
    );

    if (!isAllowed) {
        return null;
    }

    return (
        <Link href={href} legacyBehavior passHref>
            {children}
        </Link>
    );
}
