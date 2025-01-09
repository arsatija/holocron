// import { Breadcrumb, BreadcrumbList, BreadcrumbPage, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb";

import React from "react";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const data = {
    command: {
        name: "Myth HQ",
        billets: [
            {
                role: "Clone Commander",
                name: `CC-8961"Retry"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
            {
                role: "Clone Commander",
                name: `CC-6666"Rav"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
            {
                role: "Clone Captain",
                name: `CC-2206"Lindow"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
            {
                role: "Clone Warrant Officer",
                name: `N/A`,
                trooperId: "",
            },
            {
                role: "Clone Warrant Officer",
                name: `N/A`,
                trooperId: "",
            },
        ],
    },
    cinder: {
        name: "Cinder Platoon",
        billets: [
            {
                role: "Platoon Leader",
                name: `CS-1234"Fenrir"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
            {
                role: "Platoon Leader",
                name: `CS-1234"Fenrir"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
            {
                role: "Platoon Leader",
                name: `CS-1234"Fenrir"`,
                trooperId: "cde5ddaf-463b-4b3b-bf46-45fa18b86a1b",
            },
        ],
    },
};

export default function Orbat() {
    const hasLink = (trooperId: string) => {
        return trooperId == "" ? "" : "hover:text-sky-400 cursor-pointer";
    };
    return (
        // <div className=" pt-12 flex flex-col items-center">
        <div className=" pt-12 w-full grid lg:grid-cols-4 gap-4 align-top ">
            {/* Left side of ORBAT */}
            <div className="w-auto lg:col-span-1"></div>
            {/* Middle of ORBAT */}
            <div className="w-auto lg:col-span-2 flex flex-col items-center">
                <Card className="lg:w-1/2 rounded-xl">
                    <div className="text-accent9th text-center text-xl font-extrabold py-1 border-b">
                        {data.command.name}
                    </div>
                    <Table>
                        <TableBody>
                            {data.command.billets.map((item, index) => (
                                <React.Fragment key={item.name + index}>
                                    <TableRow>
                                        <TableCell className="w-1/2 text-center border-r">
                                            {item.role}
                                        </TableCell>
                                        <TableCell
                                            className={`w-1/2 text-center ${hasLink(
                                                item.trooperId
                                            )}`}
                                        >
                                            {item.trooperId == "" ? (
                                                item.name
                                            ) : (
                                                <Link
                                                    href={`/trooper/${item.trooperId}`}
                                                >
                                                    {item.name}
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Cinder Platoon */}
                <div className="w-full rounded-xl rounded-b-none border border-zinc-200 dark:border-zinc-800 shadow-md mt-8">
                    <div className="text-accent9th text-center text-xl font-extrabold py-1 border-b">
                        {data.cinder.name}
                    </div>
                    <Table>
                        <TableBody>
                            {data.cinder.billets.map((item, index) => (
                                <React.Fragment key={item.name + index}>
                                    <TableRow>
                                        <TableCell className="w-1/2 text-center border-r">
                                            {item.role}
                                        </TableCell>
                                        <TableCell className="w-1/2 text-center">
                                            {item.name}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="w-full rounded-xl rounded-t-none border border-t-0 border-zinc-200 dark:border-zinc-800 shadow-md divide-x grid grid-cols-2">
                    <div>
                        <div className="text-accent9th text-center text-xl font-semibold py-1 border-b">
                            {data.cinder.name}
                        </div>
                        <Table>
                            <TableBody>
                                {data.cinder.billets.map((item, index) => (
                                    <React.Fragment key={item.name + index}>
                                        <TableRow>
                                            <TableCell className="w-1/2 text-center border-r">
                                                {item.role}
                                            </TableCell>
                                            <TableCell className="w-1/2 text-center">
                                                {item.name}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div>
                        <div className="text-accent9th text-center text-xl font-semibold py-1 border-b">
                            {data.cinder.name}
                        </div>
                        <Table>
                            <TableBody>
                                {data.cinder.billets.map((item, index) => (
                                    <React.Fragment key={item.name + index}>
                                        <TableRow>
                                            <TableCell className="w-1/2 text-center border-r">
                                                {item.role}
                                            </TableCell>
                                            <TableCell className="w-1/2 text-center">
                                                {item.name}
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            {/* Right side of ORBAT */}
            <div className="w-auto lg:col-span-1"></div>
        </div>
    );
}
