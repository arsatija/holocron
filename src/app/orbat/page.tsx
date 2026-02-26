import React from "react";
import Orbat from "./orbat";
import OrbatSkeleton from "./_components/OrbatSkeleton";
import { getOrbat, getDepartmentOrbat } from "./_lib/queries";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";

export default async function OrbatPage() {
    const [billetsData, departmentsData] = await Promise.all([
        getOrbat(),
        getDepartmentOrbat(),
    ]);

    return (
        <div className="space-y-8">
            <Tabs className="pt-4" defaultValue="billets">
                <TabsList className="grid w-full md:w-3/4 grid-cols-2 mx-auto">
                    <TabsTrigger value="billets">Billets</TabsTrigger>
                    <TabsTrigger value="departments">Departments</TabsTrigger>
                </TabsList>
                <TabsContent value="billets">
                    <div>
                        <React.Suspense fallback={<OrbatSkeleton />}>
                            <Orbat data={billetsData} type="billets" />
                        </React.Suspense>
                    </div>
                </TabsContent>
                <TabsContent value="departments">
                    <div>
                        <React.Suspense fallback={<OrbatSkeleton />}>
                            <Orbat data={departmentsData} type="departments" />
                        </React.Suspense>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
