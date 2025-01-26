import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringEnum,
} from "nuqs/server";
import { z } from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

export const searchParamsCache = createSearchParamsCache({
    flags: parseAsArrayOf(z.enum(["advancedTable"])).withDefault([]),
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser().withDefault([]),
    trainer: parseAsString.withDefault(""),
    qualificationAbbreviation: parseAsString.withDefault(""),
    trainees: parseAsArrayOf(parseAsString).withDefault([]),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    // advanced filter
    filters: getFiltersStateParser().withDefault([]),
    joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type GetTrainingsSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;
