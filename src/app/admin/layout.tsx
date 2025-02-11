import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute
            allowedPermissions={[RankLevel.Company, RankLevel.Command, "Admin"]}
        >
            {children}
        </ProtectedRoute>
    );
}
