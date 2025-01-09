import React from "react";
import Orbat from "./orbat";
import OrbatSkeleton from "./_components/OrbatSkeleton";
export default function OrbatPage() {
    return (
        <div>
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
