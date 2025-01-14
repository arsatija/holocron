import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2
                className="size-4 animate-spin size-auto"
                color="#993534"
            />
        </div>
    );
}
