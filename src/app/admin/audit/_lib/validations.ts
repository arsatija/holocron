import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/lib/parsers";

export const searchParamsCache = createSearchParamsCache({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(50),
    sort: getSortingStateParser().withDefault([]),
    action: parseAsArrayOf(parseAsString).withDefault([]),
    entityType: parseAsArrayOf(parseAsString).withDefault([]),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
});

export type GetAuditLogsSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;
