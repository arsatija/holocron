import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
} from "nuqs/server";
import { z } from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";
import { selectEventTypesSchema } from "@/db/schema";

export const searchParamsCache = createSearchParamsCache({
    flags: parseAsArrayOf(z.enum(["advancedTable"])).withDefault([]),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser().withDefault([]),
    zeus: parseAsArrayOf(parseAsString).withDefault([]),
    coZeus: parseAsArrayOf(parseAsString).withDefault([]),
    eventType: parseAsArrayOf(
        parseAsStringEnum(selectEventTypesSchema.options)
    ).withDefault([]),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    // advanced filter
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetOperationsSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;
