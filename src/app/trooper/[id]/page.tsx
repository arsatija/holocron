import { Suspense } from "react";
import Profile from "./profile";
import Loading from "@/app/loading";

export default async function Trooper() {
    return (
        <div className="min-h-full p-4">
            {/* Client side stuff can go here too */}
            <Suspense fallback={<Loading />}>
                <Profile />
            </Suspense>
        </div>
    );
}
