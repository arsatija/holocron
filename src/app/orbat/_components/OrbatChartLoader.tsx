"use client";

import dynamic from "next/dynamic";
import { type BilletChainNode, type StructuredOrbatElement } from "../_lib/queries";

const OrbatChart = dynamic(() => import("./OrbatChart"), { ssr: false });

export default function OrbatChartLoader({
    data,
    departmentData,
}: {
    data: BilletChainNode[];
    departmentData: StructuredOrbatElement[];
}) {
    return <OrbatChart data={data} departmentData={departmentData} />;
}
