import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

export default function MedicAttendanceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute
            allowedPermissions={[
                "Admin",
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