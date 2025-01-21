"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import NavMain from "@/components/nav-main";
import ModeToggle from "@/components/mode-toggle";
import Link from "next/link";
import { Button } from "./ui/button";
import { signOut, useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useController } from "../contexts/controller";

export default function NavBar() {
    const { data: session, status } = useSession();
    const { trooperCtx, setTrooperCtx } = useController();
    const router = useRouter();

    console.log(trooperCtx);
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
                    <Button
                        variant="outline"
                        onClick={() => router.push("/login")}
                    >
                        Login
                    </Button>
                )}
                {status === "authenticated" && (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage
                                        src={session.user?.image ?? ""}
                                    />
                                    <AvatarFallback>
                                        {session.user?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-sm">
                                    Hi {session.user?.name}
                                </p>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <Link href={`/trooper/${trooperCtx?.id}`}>
                                    My Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onSelect={() => {
                                    setTrooperCtx(null);
                                    signOut();
                                }}
                            >
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <ModeToggle />
            </div>
        </header>
    );
}
