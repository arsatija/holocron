import { Suspense } from "react";
import Profile from "./profile";
import Sample from "./sample";

export default function Trooper({ params }: { params: { id: string } }) {
    return (
        <div className="min-h-full p-4">
            <Sample />
            <Suspense fallback={<div>Loading trooper data...</div>}>
                <Profile id={params.id} />
            </Suspense>
        </div>
    );
}
