"use client";

import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { setCookie } from "cookies-next/client";

export default function InvitePage() {
    const { inviteCode } = useParams();

    // useEffect(() => {
    //     // Redirect to Discord login with the inviteCode as a query parameter
    //     const loginUrl = `/api/auth/signin/discord?inviteCode=${inviteCode}`;
    //     router.push(loginUrl);
    // }, [inviteCode, router]);

    useEffect(() => {
        setCookie("inviteCode", inviteCode);
        signIn("discord", { callbackUrl: `/auth/register/${inviteCode}` });
    }, [inviteCode]);

    return null; // Render nothing, just redirect
}
