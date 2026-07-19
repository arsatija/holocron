"use client";

import { Table as TableIcon, Trash2 } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";

const TableToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, ...props }, ref) => {
        const { editor } = useToolbar();
        const inTable = editor?.isActive("table");

        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 p-0 sm:h-9 sm:w-9",
                                    inTable && "bg-accent",
                                    className
                                )}
                                ref={ref}
                                {...props}
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>Table</span>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                    {!inTable ? (
                        <DropdownMenuItem
                            onSelect={() =>
                                editor
                                    ?.chain()
                                    .focus()
                                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                                    .run()
                            }
                        >
                            Insert table
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().addColumnBefore().run()}
                            >
                                Add column before
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().addColumnAfter().run()}
                            >
                                Add column after
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().deleteColumn().run()}
                            >
                                Delete column
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().addRowBefore().run()}
                            >
                                Add row before
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().addRowAfter().run()}
                            >
                                Add row after
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().deleteRow().run()}
                            >
                                Delete row
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().mergeCells().run()}
                            >
                                Merge cells
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().splitCell().run()}
                            >
                                Split cell
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().toggleHeaderRow().run()}
                            >
                                Toggle header row
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().toggleHeaderColumn().run()}
                            >
                                Toggle header column
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => editor?.chain().focus().deleteTable().run()}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete table
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
);

TableToolbar.displayName = "TableToolbar";

export { TableToolbar };
