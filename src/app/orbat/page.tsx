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
import { billets } from "@/db/schema";

const data = {
    elements: [
        {
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
            elements: [],
        },
        {
            name: "Cinder Platoon",
            billets: [
                {
                    role: "Platoon Leader",
                    name: `CS-1234"Fenrir"`,
                    trooperId: "",
                },
                {
                    role: "Platoon Leader",
                    name: `CS-1234"Fenrir"`,
                    trooperId: "",
                },
            ],
            elements: [
                {
                    name: "Cinder 1",
                    billets: [
                        {
                            role: "Platoon Leader",
                            name: `CS-1234"Fenrir"`,
                            trooperId: "",
                        },
                        {
                            role: "Platoon Leader",
                            name: `CS-1234"Fenrir"`,
                            trooperId: "",
                        },
                    ],
                    elements: [
                        {
                            name: "Cinder 1-1",
                            billets: [
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                            ],
                            elements: [],
                        },
                        {
                            name: "Cinder 1-2",
                            billets: [
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                            ],
                            elements: [],
                        },
                    ],
                },
                {
                    name: "Cinder 2",
                    billets: [
                        {
                            role: "Platoon Leader",
                            name: `CS-1234"Fenrir"`,
                            trooperId: "",
                        },
                        {
                            role: "Platoon Leader",
                            name: `CS-1234"Fenrir"`,
                            trooperId: "",
                        },
                    ],
                    elements: [
                        {
                            name: "Cinder 2-1",
                            billets: [
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                            ],
                            elements: [],
                        },
                        {
                            name: "Cinder 2-2",
                            billets: [
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                                {
                                    role: "Platoon Leader",
                                    name: `CS-1234"Fenrir"`,
                                    trooperId: "",
                                },
                            ],
                            elements: [],
                        },
                    ],
                },
                // {
                //     name: "Cinder 3",
                //     billets: [
                //         {
                //             role: "Platoon Leader",
                //             name: `CS-1234"Fenrir"`,
                //             trooperId: "",
                //         },
                //         {
                //             role: "Platoon Leader",
                //             name: `CS-1234"Fenrir"`,
                //             trooperId: "",
                //         },
                //     ],
                //     elements: [
                //         {
                //             name: "Cinder 3-1",
                //             billets: [
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //             ],
                //             elements: [],
                //         },
                //         {
                //             name: "Cinder 3-2",
                //             billets: [
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //                 {
                //                     role: "Platoon Leader",
                //                     name: `CS-1234"Fenrir"`,
                //                     trooperId: "",
                //                 },
                //             ],
                //             elements: [],
                //         },
                //     ],
                // },
            ],
        },
    ],
};

interface OrbatElementProps {
    element: (typeof data.elements)[0];
    isRoot?: boolean;
}

function OrbatElement({ element, isRoot = false }: OrbatElementProps) {
    const hasLink = (trooperId: string) => {
        return trooperId === "" ? "" : "hover:text-sky-400 cursor-pointer";
    };

    const columnClass = (length: number) => {
        switch (length) {
            case 1:
                return "grid-cols-1";
            case 2:
                return "grid-cols-2";
            case 3:
                return "grid-cols-3";
            case 4:
                return "grid-cols-4";
            default:
                return "";
        }
    };

    return (
        <>
            <div
                className={`border-zinc-200 dark:border-zinc-800 shadow-md ${
                    isRoot ? "mt-4 rounded-xl border" : ""
                } ${
                    isRoot && element.elements.length == 0 ? "w-1/2" : "w-full"
                }`}
            >
                <div
                    className={`text-accent9th text-center text-xl ${
                        isRoot ? "font-extrabold" : "font-semibold"
                    } py-1 ${isRoot ? "border-b" : "border-y"}`}
                >
                    {element.name}
                </div>
                <Table>
                    <TableBody>
                        {element.billets.map((item, index) => (
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
                                        {item.trooperId === "" ? (
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
                {element.elements.length > 0 && (
                    <div
                        className={`w-full grid ${columnClass(
                            element.elements.length
                        )} divide-x`}
                    >
                        {element.elements.map((subElement, index) => (
                            <OrbatElement
                                key={subElement.name + index}
                                element={subElement}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default function Orbat() {
    return (
        <div className="p-8 w-full align-top">
            <div className="w-auto flex flex-col items-center">
                {data.elements.map((element, index) => (
                    <OrbatElement
                        key={element.name + index}
                        element={element}
                        isRoot={true}
                    />
                ))}
            </div>
        </div>
    );
}
