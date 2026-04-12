import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Pin } from "lucide-react";
import { getAnnouncements } from "@/services/announcements";
import { format } from "date-fns";

export default async function AnnouncementsFeed() {
    const announcements = await getAnnouncements();

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    News & Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
                {announcements.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        No announcements yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {announcements.map((a) => (
                            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-start gap-2">
                                    {a.isImportant && (
                                        <Pin className="h-3.5 w-3.5 text-accent9th shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold">
                                                {a.title}
                                            </p>
                                            <Badge
                                                variant={
                                                    a.category === "News"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                className="text-xs"
                                            >
                                                {a.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                                            {a.body}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(a.createdAt), "MMM d, yyyy")}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
