"use client";

import dynamic from "next/dynamic";
import { type StructuredOrbatElement } from "../_lib/queries";

const OrbatChart = dynamic(() => import("./OrbatChart"), { ssr: false });

export default function OrbatChartLoader({ data }: { data: StructuredOrbatElement[] }) {
    return <OrbatChart data={data} />;
}
