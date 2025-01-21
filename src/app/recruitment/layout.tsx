import { ProtectedRoute } from "@/components/protected-route";

export default function RecruitmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProtectedRoute allowedPermissions={[]}>{children}</ProtectedRoute>;
}
