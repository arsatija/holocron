"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X, Check, Loader2, ShieldAlert, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { useController } from "@/contexts/controller";
import { checkPermissionsSync } from "@/lib/permissions";
import { RankLevel } from "@/lib/types";

interface PendingDraft {
    id: string;
    content: string;
    previousContent: string | null;
    submittedAt: string;
}

interface BioProps {
    trooperId: string;
    initialBio: string | null;
}

export default function Bio({ trooperId, initialBio }: BioProps) {
    const [bio, setBio] = useState(initialBio);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(initialBio ?? "");
    const [saving, setSaving] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<PendingDraft | null>(null);
    const [moderating, setModerating] = useState(false);

    const { trooperCtx } = useController();

    const isOwnProfile = trooperCtx?.id === trooperId;
    const canModerate = checkPermissionsSync(trooperCtx ?? null, [
        "Admin",
        RankLevel.JNCO,
        RankLevel.SNCO,
        RankLevel.Company,
        RankLevel.Command,
    ]);
    const canEdit = isOwnProfile || canModerate;
    const canSeeDraft = isOwnProfile || canModerate;

    // Fetch pending draft for those who can see it
    useEffect(() => {
        if (!canSeeDraft) return;
        fetch(`/api/v1/trooperBio?trooperId=${trooperId}`)
            .then((r) => r.json())
            .then(({ draft }) => setPendingDraft(draft ?? null))
            .catch(() => {});
    }, [trooperId, canSeeDraft]);

    async function handleSave() {
        if (!trooperCtx?.id) return;
        setSaving(true);
        const res = await fetch("/api/v1/trooperBio", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trooperId, bio: draft, submittedById: trooperCtx.id }),
        });
        setSaving(false);

        if (!res.ok) {
            toast.error("Failed to submit bio.");
            return;
        }

        const data = await res.json();
        setPendingDraft({
            id: data.id,
            content: draft,
            previousContent: bio,
            submittedAt: new Date().toISOString(),
        });
        setEditing(false);
        toast.success("Bio submitted for review.");
    }

    async function handleModerate(action: "approve" | "reject") {
        if (!pendingDraft || !trooperCtx?.id) return;
        setModerating(true);
        const res = await fetch(`/api/v1/trooperBio/${pendingDraft.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, moderatorId: trooperCtx.id }),
        });
        setModerating(false);

        if (!res.ok) {
            toast.error(`Failed to ${action} bio.`);
            return;
        }

        if (action === "approve") {
            setBio(pendingDraft.content);
            toast.success("Bio approved and published.");
        } else {
            toast.success("Bio draft rejected.");
        }
        setPendingDraft(null);
    }

    function handleCancel() {
        setDraft(bio ?? "");
        setEditing(false);
    }

    return (
        <div className="space-y-3">
            {/* Approved / live bio */}
            <Card className="rounded-xl shadow-md border-[#993534]/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold leading-none tracking-tight">
                            <span className="text-accent9th mr-1">//</span>Bio
                        </h3>
                        {canEdit && !editing && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                    setDraft(bio ?? "");
                                    setEditing(true);
                                }}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-3">
                            <Textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Write a bio for this trooper..."
                                className="min-h-[120px] resize-none text-sm"
                                maxLength={1000}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {draft.length}/1000
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={saving}>
                                        {saving
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                            : <Check className="h-3.5 w-3.5 mr-1" />
                                        }
                                        Submit for Review
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {bio || <span className="italic">No bio set.</span>}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pending draft — visible to own profile + moderators */}
            {canSeeDraft && pendingDraft && (
                <Card className="rounded-xl shadow-md border-amber-500/40 bg-amber-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                                <h3 className="text-sm font-bold leading-none tracking-tight text-amber-600 dark:text-amber-400">
                                    Pending Draft
                                </h3>
                            </div>
                            {canModerate && (
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs border-red-500/40 text-red-500 hover:bg-red-500/10"
                                        onClick={() => handleModerate("reject")}
                                        disabled={moderating}
                                    >
                                        {moderating
                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                            : <ThumbsDown className="h-3 w-3 mr-1" />
                                        }
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs border-green-500/40 text-green-500 hover:bg-green-500/10"
                                        onClick={() => handleModerate("approve")}
                                        disabled={moderating}
                                    >
                                        {moderating
                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                            : <ThumbsUp className="h-3 w-3 mr-1" />
                                        }
                                        Approve
                                    </Button>
                                </div>
                            )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900 dark:text-amber-200">
                            {pendingDraft.content || <span className="italic">Empty bio submitted.</span>}
                        </p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-3">
                            Submitted {new Date(pendingDraft.submittedAt).toLocaleDateString()} · not yet visible to everyone
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
