export const save = async (slug: string, title: string, content: string) => {
    console.log("slug", slug);
    console.log("title", title);
    console.log("content", content);
    await fetch("/api/v1/wiki/updatePage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            slug,
            title,
            content: JSON.stringify(content),
        }),
    });
};
