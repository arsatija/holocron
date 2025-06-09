import { useContext } from "react";
import { useController } from "@/contexts/controller";
import { RankLevel } from "@/db/schema";
import Link from "next/link";

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

    if (allowedPermissions.length === 0) {
        return (
            <Link href={href} legacyBehavior passHref>
                {children}
            </Link>
        );
    }

    if (!controller?.trooperCtx) {
        return null;
    }

    const isRankLevelAllowed = allowedPermissions.includes(
        controller.trooperCtx.rankLevel
    );
    const isScopeAllowed = controller.trooperCtx.departments.some((scope) =>
        allowedPermissions.includes(scope)
    );
    const isAllowed = isRankLevelAllowed || isScopeAllowed;

    if (!isAllowed) {
        return null;
    }

    return (
        <Link href={href} legacyBehavior passHref>
            {children}
        </Link>
    );
}
