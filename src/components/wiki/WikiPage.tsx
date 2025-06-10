"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { checkWikiPageAccess } from "@/lib/permissions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type PermissionState = {
    canView: boolean;
    canEdit: boolean;
    viewReason?: string;
    editReason?: string;
};

export function WikiPage() {
    const { slug } = useParams();
    const { data: session } = useSession();
    const [permissions, setPermissions] = useState<PermissionState>({
        canView: false,
        canEdit: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPermissions() {
            if (!session?.user?.id || !slug) return;

            const [viewAccess, editAccess] = await Promise.all([
                checkWikiPageAccess(session.user.id, slug.toString(), "view"),
                checkWikiPageAccess(session.user.id, slug.toString(), "edit"),
            ]);

            setPermissions({
                canView: viewAccess.hasAccess,
                canEdit: editAccess.hasAccess,
                viewReason: viewAccess.reason,
                editReason: editAccess.reason,
            });
            setLoading(false);
        }

        checkPermissions();
    }, [session?.user?.id, slug]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!permissions.canView) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {permissions.viewReason ||
                        "You don't have permission to view this page"}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1>Wiki Page Title</h1>
                {permissions.canEdit && (
                    <Button
                        onClick={() => {
                            /* Navigate to edit page */
                        }}
                    >
                        Edit Page
                    </Button>
                )}
            </div>

            {/* Page content */}
            <div className="prose">{/* Your page content here */}</div>

            {!permissions.canEdit && permissions.editReason && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {permissions.editReason}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
