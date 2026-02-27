"use client";

import dynamic from "next/dynamic";
import { type BilletChainNode } from "../_lib/queries";

const OrbatChart = dynamic(() => import("./OrbatChart"), { ssr: false });

export default function OrbatChartLoader({ data }: { data: BilletChainNode[] }) {
    return <OrbatChart data={data} />;
}
