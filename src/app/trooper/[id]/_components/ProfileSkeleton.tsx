import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
    return (
        <div className="w-full px-4 md:px-8 py-4">
            <div className="w-full grid lg:grid-cols-3 gap-4 align-top">

                {/* Left column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md overflow-hidden">
                        {/* Card header */}
                        <div className="flex flex-col items-center px-6 pt-8 pb-6 gap-3 border-b border-zinc-200 dark:border-zinc-800">
                            <Skeleton className="w-[140px] h-[140px] rounded-md" />
                            <Skeleton className="h-3 w-40" />
                            <Skeleton className="h-7 w-48" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-24 rounded-full" />
                            {/* Grade bar */}
                            <div className="w-full px-2 pt-1 flex gap-1.5">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
                                ))}
                            </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 text-center">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="py-4 px-2 flex flex-col items-center gap-1.5">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Departments card */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md p-6 space-y-4">
                        <Skeleton className="h-5 w-28" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 rounded-lg" />
                            <Skeleton className="h-12 rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Attendance card */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: 365 }).map((_, i) => (
                                <Skeleton key={i} className="w-4 h-4 rounded-sm" />
                            ))}
                        </div>
                    </div>

                    {/* Qualifications card */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md p-6 space-y-6">
                        <Skeleton className="h-5 w-32" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <Skeleton key={j} className="h-12 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
