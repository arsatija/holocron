import { ProtectedRoute } from "@/components/protected-route";

export default function CampaignsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedRoute allowedPermissions={[]}>{children}</ProtectedRoute>;
}
