import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton = () => (
    <>
        <div className="p-8 w-full align-top">
            <div className="w-auto flex flex-col items-center">
                <div className="border-zinc-200 dark:border-zinc-800 shadow-md mt-4 rounded-xl border w-1/2">
                    <div className="text-accent9th text-center text-xl font-extrabold py-1 border-b p-2">
                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <tbody className="[&amp;_tr:last-child]:border-0">
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center hover:text-sky-400 cursor-pointer">
                                        <a href="/trooper/cde5ddaf-463b-4b3b-bf46-45fa18b86a1b">
                                            <Skeleton className="w-[150px] h-[20px] rounded-full mx-auto" />
                                        </a>
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[165px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center hover:text-sky-400 cursor-pointer">
                                        <a href="/trooper/cde5ddaf-463b-4b3b-bf46-45fa18b86a1b">
                                            <Skeleton className="w-[140px] h-[20px] rounded-full mx-auto" />
                                        </a>
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[175px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center hover:text-sky-400 cursor-pointer">
                                        <a href="/trooper/cde5ddaf-463b-4b3b-bf46-45fa18b86a1b">
                                            <Skeleton className="w-[130px] h-[20px] rounded-full mx-auto" />
                                        </a>
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[160px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                        <Skeleton className="w-[145px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="border-zinc-200 dark:border-zinc-800 shadow-md mt-4 rounded-xl border w-full">
                    <div className="text-accent9th text-center text-xl font-extrabold py-1 border-b">
                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <tbody className="[&amp;_tr:last-child]:border-0">
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                </tr>
                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-full grid grid-cols-2 divide-x">
                        <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                            <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                            </div>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <tbody className="[&amp;_tr:last-child]:border-0">
                                        <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                        </tr>
                                        <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                <Skeleton className="w-[200px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="w-full grid grid-cols-2 divide-x">
                                <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                                    <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                                    </div>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <tbody className="[&amp;_tr:last-child]:border-0">
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                                    <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                                    </div>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <tbody className="[&amp;_tr:last-child]:border-0">
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                            <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                            </div>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <tbody className="[&amp;_tr:last-child]:border-0">
                                        <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                        </tr>
                                        <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                            <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="w-full grid grid-cols-2 divide-x">
                                <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                                    <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                                    </div>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <tbody className="[&amp;_tr:last-child]:border-0">
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="border-zinc-200 dark:border-zinc-800 shadow-md w-full">
                                    <div className="text-accent9th text-center text-xl font-semibold py-1 border-y">
                                        <Skeleton className="w-[120px] h-[20px] rounded-full mx-auto" />
                                    </div>
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <tbody className="[&amp;_tr:last-child]:border-0">
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800">
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center border-r">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                    <td className="p-2 align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;>[role=checkbox]]:translate-y-[2px] w-1/2 text-center">
                                                        <Skeleton className="w-[180px] h-[20px] rounded-full mx-auto" />
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
);

export default LoadingSkeleton;
