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

const NavMain = () => {
  const navItems = [
      { name: "ORBAT", href: "/orbat" },
      { name: "Roster", href: "/roster" },
      { name: "Recruitment", href: "/recruitment" },
      { name: "Training", href: "/training" },
      { name: "Admin", href: "/admin" },
  ];

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.name}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {item.name}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      <NavigationMenuViewport />
    </NavigationMenu>
  );
};

export default NavMain;
