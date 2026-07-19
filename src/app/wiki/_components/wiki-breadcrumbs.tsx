import { Fragment } from "react";
import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface WikiBreadcrumbsProps {
    collection: { slug: string; name: string };
    ancestors: { id: string; title: string }[];
    currentTitle: string;
}

export function WikiBreadcrumbs({
    collection,
    ancestors,
    currentTitle,
}: WikiBreadcrumbsProps) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/wiki">Wiki</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href={`/wiki/${collection.slug}`}>{collection.name}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {ancestors.map((ancestor) => (
                    <Fragment key={ancestor.id}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/wiki/${collection.slug}/${ancestor.id}`}>
                                    {ancestor.title}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </Fragment>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}
