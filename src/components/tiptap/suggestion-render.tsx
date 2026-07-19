import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { SuggestionList, type SuggestionListRef, type SuggestionItem } from "./suggestion-list";

// Shared `render()` factory for @tiptap/suggestion — mounts SuggestionList via
// ReactRenderer and hands positioning off to Suggestion's built-in Floating UI
// `mount()` helper (auto-anchors to the cursor, repositions on scroll/resize,
// no manual clientRect bookkeeping needed).
export function createSuggestionRender(
    emptyLabel: string
): NonNullable<SuggestionOptions<SuggestionItem, SuggestionItem>["render"]> {
    return () => {
        let component: ReactRenderer<SuggestionListRef>;
        let unmount: (() => void) | undefined;

        return {
            onStart: (props) => {
                component = new ReactRenderer(SuggestionList, {
                    props: { items: props.items, command: props.command, loading: props.loading, emptyLabel },
                    editor: props.editor,
                });
                if (!props.clientRect) return;
                unmount = props.mount(component.element as HTMLElement);
            },
            onUpdate(props) {
                component.updateProps({
                    items: props.items,
                    command: props.command,
                    loading: props.loading,
                    emptyLabel,
                });
            },
            onKeyDown(props) {
                if (props.event.key === "Escape") {
                    unmount?.();
                    return true;
                }
                return component.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
                unmount?.();
                component.destroy();
            },
        };
    };
}
