export interface TocHeading {
    level: number;
    text: string;
}

// Extracts h1-h4 headings from TipTap-generated HTML.
// Strips inner tags so bold/linked heading text is handled correctly.
export function extractHeadings(html: string): TocHeading[] {
    const headings: TocHeading[] = [];
    const regex = /<h([1-4])[^>]*>([\s\S]*?)<\/h[1-4]>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html))) {
        const level = parseInt(match[1], 10);
        const text = match[2].replace(/<[^>]*>/g, "").trim();
        if (text) headings.push({ level, text });
    }
    return headings;
}
