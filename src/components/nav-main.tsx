"use client";

import React from "react";
import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuViewport,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { RankLevel } from "@/lib/types";
import { ProtectedNavItem } from "./protected-nav-item";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NavMain = () => {
    const navItems = [
        { name: "ORBAT", href: "/orbat" },
        { name: "Roster", href: "/roster" },
        { name: "Recruitment", href: "/recruitment", permissions: [] },
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
        { name: "Wiki", href: "/wiki" },
    ];

    const pathname = usePathname();

    return (
        <NavigationMenu>
            <NavigationMenuList>
                {navItems.map((item) => (
                    <NavigationMenuItem key={item.name}>
                        <ProtectedNavItem
                            href={item.href}
                            allowedPermissions={item.permissions ?? []}
                        >
                            <NavigationMenuLink
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    pathname === item.href && "font-bold"
                                )}
                            >
                                {item.name}
                            </NavigationMenuLink>
                        </ProtectedNavItem>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
            <NavigationMenuViewport />
        </NavigationMenu>
    );
};

export default NavMain;
