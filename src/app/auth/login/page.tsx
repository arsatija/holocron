"use client";

import { useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { getTrooper } from "@/services/troopers";
import { getFullTrooperName } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { getTrooperByAccount } from "@/services/users";

export default function LoginAuthPage() {
    const { inviteCode }: { inviteCode: string } = useParams();
    const { data: session, status } = useSession(); // Get session status
    const router = useRouter();

    const [loggingIn, startLoggingIn] = useTransition();
    console.log("Invite code:", inviteCode);
    console.log("Session:", session);
    console.log("Auth status:", status);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            startLoggingIn(async () => {
                const response = await getTrooperByAccount(
                    session?.user?.name || ""
                );
                if (response) {
                    const trooper = await getTrooper(response.trooperId);
                    if (!trooper) {
                        toast.error("Something went wrong");
                        router.push(
                            "/login/message=Couldn't find your trooper... Contact an Admin."
                        );
                    } else {
                        const trooperName = getFullTrooperName(trooper);
                        toast.success(`Welcome ${trooperName}`);
                        router.push("/");
                    }
                } else {
                    toast.error("Something went wrong");
                    signOut({
                        callbackUrl:
                            "/login?message=No trooper linked to your discord account.",
                    });
                }
            });
        }
    }, [session, status]);

    return loggingIn ? (
        <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="animate-spin" />
            <p>Logging you in...</p>
        </div>
    ) : null;
}
