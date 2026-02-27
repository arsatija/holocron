import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { type BilletNodeData } from "../_lib/chartUtils";
import Image from "next/image";
import Link from "next/link";

type BilletNodeType = Node<BilletNodeData, "billetNode">;

export default function BilletNode({ data }: NodeProps<BilletNodeType>) {
    const isVacant = !data.trooper || !data.trooper.name;
    const displayName = data.trooper
        ? `${data.trooper.rankAbbreviation} ${data.trooper.name}`
        : "Vacant";

    return (
        <>
            {data.hasParent && (
                <Handle type="target" position={Position.Top} className="!bg-accent9th !border-accent9th" />
            )}
            <div className="bg-card border border-accent9th/60 ring-1 ring-accent9th/60 rounded-lg px-3 py-2.5 w-full nodrag nowheel flex items-center gap-3">
                {/* Unit element icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {data.unitElementIcon ? (
                        <Image
                            src={data.unitElementIcon}
                            alt={data.unitElementName}
                            width={36}
                            height={36}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <span className="text-xs font-bold text-muted-foreground">?</span>
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    {isVacant ? (
                        <p className="text-xs font-semibold text-muted-foreground truncate leading-tight">
                            {displayName}
                        </p>
                    ) : (
                        <Link href={`/trooper/${data.trooper!.id}`}>
                            <p className="text-xs font-semibold truncate leading-tight hover:underline hover:text-accent9th">
                                {displayName}
                            </p>
                        </Link>
                    )}
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        {data.role}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isVacant ? "bg-muted-foreground/50" : "bg-accent9th"
                            }`}
                        />
                        <p className="text-xs text-muted-foreground truncate leading-tight">
                            {data.unitElementName}
                        </p>
                    </div>
                </div>
            </div>
            {data.hasChildren && (
                <Handle type="source" position={Position.Bottom} className="!bg-accent9th !border-accent9th" />
            )}
        </>
    );
}
