"use client";

import { useSession } from "next-auth/react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { linkUserToTrooper } from "@/services/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const { inviteCode }: { inviteCode: string } = useParams();
    const { data: session, status } = useSession(); // Get session status
    const router = useRouter();

    const [linkingUser, startLinkingUser] = useTransition();
    console.log("Invite code:", inviteCode);
    console.log("Session:", session);
    console.log("Auth status:", status);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            startLinkingUser(async () => {
                const response = await linkUserToTrooper(
                    inviteCode,
                    session!.user!
                );
                if (response) {
                    router.push("/auth/login");
                } else {
                    toast.error("Something went wrong");
                    router.push("/");
                }
            });
        }
    }, [inviteCode, session, status]);

    return linkingUser ? (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="animate-spin" />
            <p>Linking you to your trooper...</p>
        </div>
    ) : null;
}
