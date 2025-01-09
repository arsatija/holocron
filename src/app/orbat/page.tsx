import React from "react";
import Orbat from "./orbat";
import LoadingSkeleton from "./skeleton";
import { Skeleton } from "@/components/ui/skeleton";
export default function OrbatPage() {
    return (
        <div>
            <React.Suspense
                fallback={
                    <div className="w-full h-full flex justify-center items-center">
                        <LoadingSkeleton />
                    </div>
                }
            >
                <Orbat />
            </React.Suspense>
        </div>
    );
}
