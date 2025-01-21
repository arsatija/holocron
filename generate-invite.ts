export async function generateInvite(trooperId: string) {
    const response = await fetch("/api/v1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trooperId: trooperId }), // Send trooperId
    });

    const { inviteLink } = await response.json();

    return inviteLink;
}

const inviteLink = await generateInvite("e076b47c-dec5-4dc6-b20f-4e03112af581");

console.log(inviteLink);

