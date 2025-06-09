import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export const useTitle = () => {
    const { slug } = useParams();
    const [title, setTitle] = useState("");

    // Reset title when slug changes
    useEffect(() => {
        if (slug) {
            fetch(`/api/v1/wiki/getBySlug?slug=${slug}`)
                .then((res) => res.json())
                .then((data) => {
                    setTitle(data.title);
                });
        }
    }, [slug]);

    return { title, setTitle };
};
