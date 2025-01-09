import { Suspense } from "react";
import Profile from "./profile";
import ProfileSkeleton from "./_components/ProfileSkeleton";

export default async function Trooper({ params }: { params: { id: string } }) {
    params = await params;

    return (
        <div className="min-h-full p-4">
            {/* Client side stuff can go here too */}
            <Suspense fallback={<ProfileSkeleton />}>
                <Profile id={params.id} />
            </Suspense>
        </div>
    );
}
