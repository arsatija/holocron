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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useController } from "../contexts/controller";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "./ui/sheet";
import { Menu } from "lucide-react";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";
import { useState } from "react";

const navItems = [
    { name: "ORBAT", href: "/orbat" },
    { name: "Roster", href: "/roster" },
    { name: "Campaigns", href: "/campaigns" },
    { name: "Events", href: "/events" },
    { name: "Recruitment", href: "/recruitment", permissions: [] as string[] },
    {
        name: "Training",
        href: "/training",
        permissions: ["Training", RankLevel.Company, RankLevel.Command],
    },
    {
        name: "Admin",
        href: "/admin",
        permissions: [RankLevel.Company, RankLevel.Command, "Admin"],
    },
];

export default function NavBar() {
    const { data: session, status } = useSession();
    const { trooperCtx, setTrooperCtx, revalidateTrooperCtx } = useController();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const visibleMobileNavItems = navItems.filter((item) => {
        if (!item.permissions) return true;
        if (item.permissions.length === 0) return true;
        return checkPermissionsSync(trooperCtx, item.permissions);
    });

    return (
        <header className="bg-background border-b border-accent9th border-grid backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 z-40">
            <div className="flex gap-2 md:gap-8 p-4 items-center">
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
                        className="scroll-m-20 text-xl md:text-4xl font-extrabold tracking-tight lg:text-5xl hover:text-sky-400"
                        href="/"
                    >
                        Holocron
                    </Link>
                </div>
                <div className="hidden md:flex">
                    <NavMain />
                </div>
            </div>
            <div className="flex gap-2 md:gap-4 p-4 items-center">
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
                                <p className="text-sm hidden sm:block">
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => {
                                    revalidateTrooperCtx();
                                }}
                            >
                                Refresh Trooper Info
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
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="flex md:hidden"
                            aria-label="Open navigation menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center gap-2 p-4 border-b">
                                <Image
                                    alt="9th Assault Corps"
                                    src="/images/9_logo.png"
                                    height={32}
                                    width={32}
                                />
                                <SheetTitle className="font-bold text-lg">
                                    Holocron
                                </SheetTitle>
                            </div>
                            <nav className="flex flex-col gap-1 p-3">
                                {visibleMobileNavItems.map((item) => (
                                    <SheetClose asChild key={item.name}>
                                        <Link
                                            href={item.href}
                                            className="flex items-center w-full px-3 py-3 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
                                        >
                                            {item.name}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </nav>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
