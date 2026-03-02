import { Trooper } from "@/db/schema";
import { ranks } from "./definitions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Parses a date-only string (YYYY-MM-DD) as local midnight to avoid
 * UTC-offset shifts. Full ISO timestamps are passed through unchanged.
 */
export function parseLocalDate(dateStr: string): Date {
    // Append local-time marker so the engine treats it as local midnight,
    // not UTC midnight (which would shift the displayed date for UTC− zones).
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00");
    }
    return new Date(dateStr);
}

export function formatDate(
    date: Date | string | number,
    opts: Intl.DateTimeFormatOptions = {}
) {
    // Auto-fix date-only strings that would otherwise be interpreted as UTC midnight
    const d =
        typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
            ? new Date(date + "T00:00:00")
            : new Date(date);
    return new Intl.DateTimeFormat("en-US", {
        month: opts.month ?? "long",
        day: opts.day ?? "numeric",
        year: opts.year ?? "numeric",
        ...opts,
    }).format(d);
}

export function toSentenceCase(str: string) {
    return str
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace(/\s+/g, " ")
        .trim();
}

export function hslToHex(hsl: string): string {
    // Extract the H, S, and L values from the HSL string
    const [h, s, l] = hsl.match(/(\d+(\.\d+)?)/g)?.map(Number) || [0, 0, 0];

    // Convert to the range [0, 1]
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    // Helper function for converting to RGB
    const hueToRgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    // Calculate RGB values
    let r: number, g: number, b: number;
    if (sDecimal === 0) {
        r = g = b = lDecimal; // Achromatic
    } else {
        const q =
            lDecimal < 0.5
                ? lDecimal * (1 + sDecimal)
                : lDecimal + sDecimal - lDecimal * sDecimal;
        const p = 2 * lDecimal - q;
        r = hueToRgb(p, q, h / 360 + 1 / 3);
        g = hueToRgb(p, q, h / 360);
        b = hueToRgb(p, q, h / 360 - 1 / 3);
    }

    // Convert to hexadecimal
    const toHex = (x: number) =>
        Math.round(x * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * @see https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
 */
export function composeEventHandlers<E>(
    originalEventHandler?: (event: E) => void,
    ourEventHandler?: (event: E) => void,
    { checkForDefaultPrevented = true } = {}
) {
    return function handleEvent(event: E) {
        originalEventHandler?.(event);

        if (
            checkForDefaultPrevented === false ||
            !(event as unknown as Event).defaultPrevented
        ) {
            return ourEventHandler?.(event);
        }
    };
}

/**
 * Formats a trooper's full name according to military convention
 * @param trooper - The trooper object containing rank, numbers and name
 * @returns A string in the format "RANK-#### 'NAME'" (e.g. "CC-6666 'Rav'")
 */
export function getFullTrooperName(trooper: {
    rank: number;
    numbers: number;
    name: string;
}): string {
    return `${ranks[trooper.rank].abbreviation}-${trooper.numbers} "${
        trooper.name
    }"`;
}

/**
 * Formats a trooper's full name according to military convention
 * @param trooper - The trooper object containing rank, numbers and name
 * @returns A string in the format "RANK-#### 'NAME'" (e.g. "CC-6666 'Rav'")
 */
export function getShortTrooperName(trooper: {
    rank: number;
    name: string;
}): string {
    return `${ranks[trooper.rank].abbreviation} ${trooper.name}`;
}

/**
 * Finds the difference between two arrays
 * @param array1 - The first array
 * @param array2 - The second array
 * @returns An array of items that are in array1 but not in array2
 */
export function findDifference<T>(array1: T[], array2: T[]) {
    return array1.filter((item) => !array2.includes(item));
}
