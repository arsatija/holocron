"use client";

import Image from "next/image";
import NavMain from "@/components/nav-main";
import ModeToggle from "@/components/mode-toggle";
import Link from "next/link";

export default function NavBar() {
  return (
    <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <nav className="flex gap-8 p-4 items-end">
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
      </nav>
      <div className="p-4">
        <ModeToggle />
      </div>
    </header>
  );
}
