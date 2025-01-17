"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import NavMain from "@/components/nav-main";
import ModeToggle from "@/components/mode-toggle";
import Link from "next/link";
import { Button } from "./ui/button";
import { signOut, useSession } from "next-auth/react";

export default function NavBar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    return (
        <header className=" bg-background border-b border-accent9th border-grid backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 z-40">
            <div className="flex gap-8 p-4 items-center">
                <div className="flex lg:flex-1 gap-2 items-center">
                    <a href="#">
                        <Image
                            alt="9th Assault Corps"
                            src="/images/9_logo.png"
                            height={48}
                            width={48}
                            priority
                        />
                    </a>
                    <Link
                        className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl hover:text-sky-400"
                        href="/"
                    >
                        Holocron
                    </Link>
                </div>
                <NavMain />
            </div>
            <div className="flex gap-4 p-4 items-center">
                {status === "unauthenticated" && (
                    <Button variant="outline" onClick={() => router.push("/login")}>Login</Button>
                )}
                {status === "authenticated" && (
                    <Button variant="outline" onClick={() => signOut()}>Logout</Button>
                )}
                <ModeToggle />
            </div>
        </header>
    );
}
