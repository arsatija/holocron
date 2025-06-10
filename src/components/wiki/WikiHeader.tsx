"use client";

import {
    useParams,
    useRouter,
    usePathname,
    useSelectedLayoutSegments,
} from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { save } from "@/app/wiki/actions";
import { useWikiPage } from "@/hooks/use-wiki-page";
import {CreateWikiPage} from "@/app/wiki/CreatePage";

export function WikiHeader() {
    const router = useRouter();
    const { slug } = useParams();
    const { state } = useSidebar();
    const segments = useSelectedLayoutSegments();
    const pathname = usePathname();
    const { blocks, title } = useWikiPage();
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (pathname?.includes("/edit")) {
            setIsEditMode(true);
        } else {
            setIsEditMode(false);
        }
    }, [pathname]);

    const handleSave = async () => {
        if (!slug || !blocks || !title) return;
        await save(slug.toString(), title, JSON.stringify(blocks));
        router.push(`/wiki/${slug}`);
    };

    return (
        <>
            <div
                className="fixed top-16 left-0 right-0 z-50 flex justify-center items-center py-2 px-4 transition-all duration-200 ease-linear bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60"
                style={{
                    width:
                        state === "expanded"
                            ? `calc(100% - var(--sidebar-width, 0px))`
                            : "100%",
                    marginLeft:
                        state === "expanded"
                            ? "var(--sidebar-width, 0px)"
                            : "0px",
                }}
            >
                <div className="flex justify-between flex-row w-full">
                    <div className="flex flex-row gap-2 items-center">
                        <SidebarTrigger />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem key="wiki">
                                    <BreadcrumbLink href="/wiki">
                                        Wiki
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                {segments.map((segment, i, arr) => (
                                    <>
                                        <BreadcrumbItem key={i}>
                                            <BreadcrumbLink
                                                href={`/wiki/${arr
                                                    .slice(0, i + 1)
                                                    .join("/")}`}
                                            >
                                                {segment
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    segment.slice(1)}
                                            </BreadcrumbLink>
                                        </BreadcrumbItem>
                                        {i < arr.length - 1 && (
                                            <BreadcrumbSeparator />
                                        )}
                                    </>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex flex-row gap-2">
                        {pathname !== "/wiki" ? (
                            isEditMode ? (
                                <Button onClick={handleSave} variant="default">
                                    Save
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        router.push(`/wiki/${slug}/edit`);
                                    }}
                                    variant="outline"
                                >
                                    Edit
                                </Button>
                            )
                        ) : (
                            <CreateWikiPage />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
