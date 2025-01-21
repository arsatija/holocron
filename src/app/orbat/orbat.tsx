import React from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { StructuredOrbatElement } from "./_lib/queries";

type OrbatType = "billets" | "departments";

interface OrbatProps {
    data: StructuredOrbatElement[];
    type: OrbatType;
}

interface OrbatElementProps {
    element: StructuredOrbatElement;
    isRoot?: boolean;
}

function OrbatElement({ element, isRoot = false }: OrbatElementProps) {
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
                                    <TableCell className={`w-1/2 text-center`}>
                                        {item.trooperId === "" ? (
                                            item.name
                                        ) : (
                                            <Link
                                                href={`/trooper/${item.trooperId}`}
                                                className="hover:underline"
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

export default function Orbat({ data, type }: OrbatProps) {
    return (
        <div className="p-8 lg:w-3/4 w-full align-top mx-auto">
            <div className="w-auto flex flex-col items-center">
                {data.map((element, index) => (
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
