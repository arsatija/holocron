import { Skeleton } from "@/components/ui/skeleton";

export default function HeatmapSkeleton() {
    return (
        <div className="p-6 pt-0 space-y-4">
            <div className="flex flex-wrap gap-1">
                {Array.from({ length: 365 }).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="w-4 h-4 rounded-sm bg-zinc-800"></Skeleton>
                    </div>
                ))}
            </div>
        </div>
    );
}
