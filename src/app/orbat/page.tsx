import React from "react";
import Orbat from "./orbat";
import OrbatSkeleton from "./_components/OrbatSkeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
export default function OrbatPage() {
    return (
        <div className="">
            <React.Suspense
                fallback={
                    <div className="w-full h-full flex justify-center items-center">
                        <OrbatSkeleton />
                    </div>
                }
            >
                <Orbat />
            </React.Suspense>
        </div>
    );
}
