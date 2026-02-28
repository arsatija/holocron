import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { type OrbatNodeData } from "../_lib/chartUtils";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import Link from "next/link";

type OrbatNodeType = Node<OrbatNodeData, "orbatNode">;

export default function OrbatNode({ data }: NodeProps<OrbatNodeType>) {
    return (
        <>
            {data.hasParent && <Handle type="target" position={Position.Top} />}
            <Card className="w-full overflow-hidden rounded-lg nodrag border-accent9th ring-1 ring-accent9th">
                <CardHeader className="py-2 px-3 border-b">
                    <p className="text-accent9th text-center font-semibold text-sm leading-tight">
                        {data.name}
                    </p>
                </CardHeader>
                {data.billets.length > 0 && (
                    <Table>
                        <TableBody>
                            {data.billets.map((billet, index) => (
                                <TableRow key={billet.role + index}>
                                    <TableCell className="w-1/2 text-center border-r py-1 px-2 text-xs">
                                        {billet.role}
                                    </TableCell>
                                    <TableCell className="w-1/2 text-center py-1 px-2 text-xs">
                                        {billet.trooperId === "" ? (
                                            <span className="text-muted-foreground">{billet.name}</span>
                                        ) : (
                                            <Link
                                                href={`/trooper/${billet.trooperId}`}
                                                className="hover:underline hover:text-accent9th"
                                            >
                                                {billet.name}
                                            </Link>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>
            {data.hasChildren && <Handle type="source" position={Position.Bottom} />}
        </>
    );
}
