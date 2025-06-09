import { PartialBlock } from "@blocknote/core";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type WikiPageState = {
    blocks: PartialBlock[] | undefined;
    title: string;
};

let memoryState: WikiPageState = {
    blocks: undefined,
    title: "",
};

const listeners: Array<(state: WikiPageState) => void> = [];

function dispatch(state: WikiPageState) {
    memoryState = state;
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

export const useWikiPage = () => {
    const { slug } = useParams();
    const [state, setState] = useState<WikiPageState>(memoryState);

    useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    useEffect(() => {
        if (slug) {
            fetch(`/api/v1/wiki/getBySlug?slug=${slug}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.content.length === 0) {
                        dispatch({
                            blocks: undefined,
                            title: data.title,
                        });
                    } else {
                        dispatch({
                            blocks: JSON.parse(data.content) as PartialBlock[],
                            title: data.title,
                        });
                    }
                });
        }
    }, [slug]);

    const setBlocks = (blocks: PartialBlock[] | undefined) => {
        dispatch({
            ...memoryState,
            blocks,
        });
    };

    const setTitle = (title: string) => {
        dispatch({
            ...memoryState,
            title,
        });
    };

    return {
        blocks: state.blocks,
        title: state.title,
        setBlocks,
        setTitle,
    };
};
