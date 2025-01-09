import { Card } from "@/components/ui/card";

export default function Sample() {
    return (
        <div className="min-h-full p-4">
            <div className="w-full md:w-auto grid grid-cols-3 gap-4">
                <Card className="rounded-xl shadow-md w-auto col-span-1">
                    <p>left column</p>
                </Card>
                <Card className="rounded-xl shadow-md w-auto col-span-2">
                    <p>right column</p>
                </Card>
            </div>
        </div>
    );
}
