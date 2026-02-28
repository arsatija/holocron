"use client";

import { useState } from "react";
import { type StructuredOrbatElement } from "../_lib/queries";
import OrbatChartLoader from "./OrbatChartLoader";
import Orbat from "../orbat";

type Tab = "orbat" | "departments";

export default function OrbatTabs({
    billetsData,
    departmentsData,
}: {
    billetsData: StructuredOrbatElement[];
    departmentsData: StructuredOrbatElement[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>("orbat");

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex w-full border-b shrink-0">
                <button
                    onClick={() => setActiveTab("orbat")}
                    className={`w-[50vw] py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                        activeTab === "orbat"
                            ? "border-accent9th text-accent9th"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    ORBAT
                </button>
                <button
                    onClick={() => setActiveTab("departments")}
                    className={`w-[50vw] py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                        activeTab === "departments"
                            ? "border-accent9th text-accent9th"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Departments
                </button>
            </div>
            <div className="flex-1 min-h-0">
                {activeTab === "orbat" ? (
                    <OrbatChartLoader data={billetsData} />
                ) : (
                    <div className="overflow-y-auto h-full py-4">
                        <Orbat data={departmentsData} type="departments" />
                    </div>
                )}
            </div>
        </div>
    );
}
