import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSkeleton() {
    return (
        <div className="min-h-full py-4 px-8">
            <div className="w-full grid lg:grid-cols-3 gap-4 align-top">
                <div className="w-auto lg:col-span-1 space-y-4">
                    <div className="border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-xl shadow-md">
                        <div className="space-y-12">
                            <div className="p-6 relative">
                                <div className="flex flex-col items-center">
                                    <Skeleton className="aspect-square object-contain w-[225px] h-[225px]" />
                                    <div className="pt-6">
                                        <Skeleton className="h-9 w-48" />
                                    </div>
                                    <div className="text-lg text-muted-foreground py-2">
                                        <Skeleton className="w-24 h-4" />
                                    </div>
                                    <div className="rounded-xl w-1/4 h-8 mt-6">
                                        <Skeleton className="h-full w-full" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 divide-x text-center mt-10">
                                    <div>
                                        <Skeleton className="h-7 w-32 mx-auto mb-1" />
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </div>
                                    <div>
                                        <Skeleton className="h-7 w-32 mx-auto mb-1" />
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </div>
                                    <div>
                                        <Skeleton className="h-7 w-32 mx-auto mb-1" />
                                        <Skeleton className="h-4 w-24 mx-auto" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-xl shadow-md">
                        <div className="p-6 relative">
                            <div className="flex flex-col space-y-1.5 p-6">
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <div className="p-6 pt-0 space-y-4">
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 w-auto space-y-4">
                    <div className="border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-xl shadow-md">
                        <div className="p-6 relative">
                            <div className="flex flex-col space-y-1.5 p-6">
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <div className="p-6 pt-0 space-y-4">
                                <div className="flex flex-wrap gap-1">
                                    {Array.from({ length: 365 }).map((_, i) => (
                                        <div key={i}>
                                            <Skeleton className="w-4 h-4 rounded-sm bg-zinc-800"></Skeleton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-zinc-200 bg-white text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 rounded-xl shadow-md">
                        <div className="p-6 relative">
                            <div className="flex flex-col space-y-1.5 p-6">
                                <h3 className="leading-none tracking-tight">
                                    <Skeleton className="w-[112px] max-w-full" />
                                </h3>
                            </div>
                            <div className="p-6 pt-0 space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[112px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[104px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[72px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[64px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[136px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[192px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[72px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[64px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[168px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[40px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[184px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[200px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[200px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[224px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[88px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[80px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[184px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[152px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[136px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="shadow-base border h-12 flex justify-center align-middle items-center rounded-lg">
                                            <Skeleton className="w-[192px] h-[40px] max-w-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
