import { ProtectedRoute } from "@/components/protected-route";
import { RankLevel } from "@/lib/types";

export default function TrainingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute
            allowedPermissions={[
                RankLevel.Company,
                RankLevel.Command,
                "Training",
            ]}
        >
            {children}
        </ProtectedRoute>
    );
}
