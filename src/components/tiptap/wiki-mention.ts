import { mergeAttributes } from "@tiptap/core";
import Mention from "@tiptap/extension-mention";
import { createSuggestionRender } from "./suggestion-render";
import {
    searchPagesForLinkAction,
    searchTroopersForMentionAction,
} from "@/app/wiki/_lib/actions";

// Single Mention node, two triggers: "@" for trooper mentions (-> /trooper/[id])
// and "[[" for internal page links (-> /wiki/[collectionSlug]/[pageId]). Both
// render as <a> tags carrying data-type="mention" + data-mention-suggestion-char
// so they round-trip correctly when saved HTML is reloaded into the editor.
//
// Page links additionally render data-wiki-page-id — that's the attribute
// src/services/wiki.ts's extractLinkedPageIds() reads on save to populate
// wiki_page_links (backlinks). Trooper mentions deliberately don't carry that
// attribute so they're never mistaken for a page link.
const WikiMention = Mention.extend({
    name: "mention",

    addAttributes() {
        const parent = (this.parent?.() ?? {}) as Record<string, { renderHTML?: unknown }>;
        return {
            ...parent,
            id: {
                ...parent.id,
                renderHTML: (attributes: Record<string, unknown>) => {
                    if (!attributes.id) return {};
                    const attrs: Record<string, string> = {
                        "data-id": String(attributes.id),
                    };
                    if (attributes.mentionSuggestionChar === "[[") {
                        attrs["data-wiki-page-id"] = String(attributes.id);
                    }
                    return attrs;
                },
            },
            collectionSlug: {
                default: null,
                parseHTML: (element: HTMLElement) =>
                    element.getAttribute("data-collection-slug"),
                renderHTML: (attributes: Record<string, unknown>) =>
                    attributes.collectionSlug
                        ? { "data-collection-slug": attributes.collectionSlug }
                        : {},
            },
        };
    },

    parseHTML() {
        return [
            { tag: `a[data-type="${this.name}"]` },
            { tag: `span[data-type="${this.name}"]` },
        ];
    },
});

export const wikiMentionExtension = WikiMention.configure({
    renderHTML({ options, node }) {
        const isPageLink = node.attrs.mentionSuggestionChar === "[[";
        const href = isPageLink
            ? `/wiki/${node.attrs.collectionSlug}/${node.attrs.id}`
            : `/trooper/${node.attrs.id}`;
        return [
            "a",
            mergeAttributes(options.HTMLAttributes, {
                href,
                class: isPageLink
                    ? "wiki-page-link text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                    : "wiki-mention text-primary bg-primary/10 rounded px-1 no-underline",
            }),
            isPageLink
                ? (node.attrs.label ?? "Untitled")
                : `@${node.attrs.label ?? node.attrs.id}`,
        ];
    },
    suggestions: [
        {
            char: "@",
            items: async ({ query }) => searchTroopersForMentionAction(query),
            render: createSuggestionRender("No troopers found"),
        },
        {
            char: "[[",
            items: async ({ query }) => searchPagesForLinkAction(query),
            render: createSuggestionRender("No pages found"),
        },
    ],
});
