import { Spinner } from "@/components/ui/spinner";

// Covers the content area (not the sidebar, which lives in layout.tsx and
// stays mounted across in-section navigations) while a wiki page's server
// data resolves.
export default function WikiLoading() {
    return (
        <div className="flex items-center justify-center py-24">
            <Spinner className="size-auto" />
        </div>
    );
}
