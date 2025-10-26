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

const NavMain = () => {
    const navItems = [
        { name: "ORBAT", href: "/orbat" },
        { name: "Roster", href: "/roster" },
        { name: "Campaigns", href: "/campaigns" },
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
    ];

    return (
        <NavigationMenu>
            <NavigationMenuList>
                {navItems.map((item) => (
                    <NavigationMenuItem key={item.name}>
                        {item.permissions ? (
                            <ProtectedNavItem
                                href={item.href}
                                allowedPermissions={item.permissions ?? []}
                            >
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                >
                                    {item.name}
                                </NavigationMenuLink>
                            </ProtectedNavItem>
                        ) : (
                            <Link href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                >
                                    {item.name}
                                </NavigationMenuLink>
                            </Link>
                        )}
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
            <NavigationMenuViewport />
        </NavigationMenu>
    );
};

export default NavMain;
