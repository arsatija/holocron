"use client";

import {
    useParams,
    useRouter,
    usePathname,
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

export default function WikiPageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { slug } = useParams();
    const { state } = useSidebar();
    const pathname = usePathname();

    const segments = pathname.split("/").filter((segment) => segment !== "");

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
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/wiki">
                                        Wiki
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                {slug
                                    ?.toString()
                                    .split("/")
                                    .map((segment, i, arr) => (
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
                        <Button
                            onClick={() => {
                                router.push(`/wiki/${slug}/edit`);
                            }}
                            variant="outline"
                        >
                            Edit
                        </Button>
                    </div>
                </div>
            </div>
            {children}
        </>
    );
}
