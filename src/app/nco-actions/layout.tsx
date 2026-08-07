import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

export default function NcoActionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute
            allowedPermissions={[
                RankLevel.JNCO,
                RankLevel.SNCO,
                RankLevel.Company,
                RankLevel.Command,
            ]}
        >
            {children}
        </ProtectedRoute>
    );
}