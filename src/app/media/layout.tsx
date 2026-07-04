import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

export default function MediaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute
            allowedPermissions={[
                "Admin",
                RankLevel.SNCO,
                RankLevel.Company,
                RankLevel.Command,
            ]}
        >
            {children}
        </ProtectedRoute>
    );
}
