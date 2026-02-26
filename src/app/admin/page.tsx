import { Construction } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
    return (
        <div className="h-full flex-1 flex items-center justify-center container mx-auto p-8">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <Construction className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Admin</CardTitle>
                    <CardDescription>
                        More features coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent />
            </Card>
        </div>
    );
}
