"use client";

import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandItem,
    CommandEmpty,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { X as RemoveIcon, Check } from "lucide-react";
import React, {
    KeyboardEvent,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useState,
    useMemo,
    useRef,
} from "react";

interface Option {
    label: string;
    value: string;
}

interface MultiSelectorProps
    extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
    values: string[];
    onValuesChange: (value: string[]) => void;
    options: Option[];
    loop?: boolean;
    /** Called whenever the search input changes. Use this to filter items in the parent. */
    onSearchChange?: (value: string) => void;
}

// Main context – intentionally excludes inputValue so MultiSelectorItem does not
// re-render on every keystroke. Only re-renders when selection or navigation changes.
interface MultiSelectContextProps {
    value: string[];
    onValueChange: (value: any) => void;
    options: Option[];
    open: boolean;
    setOpen: (value: boolean) => void;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
    ref: React.RefObject<HTMLInputElement>;
    handleSelect: (e: React.SyntheticEvent<HTMLInputElement>) => void;
}

// Separate context that only carries the search string.
// Only MultiSelectorInput subscribes to this, so typing only re-renders the input.
const MultiSelectContext = createContext<MultiSelectContextProps | null>(null);
const MultiSelectSearchContext = createContext<string>("");

const useMultiSelect = () => {
    const context = useContext(MultiSelectContext);
    if (!context) {
        throw new Error(
            "useMultiSelect must be used within MultiSelectProvider"
        );
    }
    return context;
};

const useMultiSelectSearch = () => useContext(MultiSelectSearchContext);

const MultiSelector = ({
    values: value,
    onValuesChange: onValueChange,
    loop = false,
    className,
    children,
    dir,
    options = [],
    onSearchChange,
    ...props
}: MultiSelectorProps) => {
    const [inputValue, setInputValue] = useState("");
    const [open, setOpen] = useState<boolean>(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isValueSelected, setIsValueSelected] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState("");

    // Refs so handleKeyDown and handleSelect can read current values without
    // being in the dependency array (keeping them stable between keystrokes).
    const inputValueRef = useRef(inputValue);
    inputValueRef.current = inputValue;
    const selectedValueRef = useRef(selectedValue);
    selectedValueRef.current = selectedValue;
    const isValueSelectedRef = useRef(isValueSelected);
    isValueSelectedRef.current = isValueSelected;

    // Wraps setInputValue so callers also trigger the optional onSearchChange callback.
    const setInputValueAndNotify = useCallback(
        (val: React.SetStateAction<string>) => {
            setInputValue((prev) => {
                const next = typeof val === "function" ? val(prev) : val;
                onSearchChange?.(next);
                return next;
            });
        },
        [onSearchChange]
    );

    const onValueChangeHandler = useCallback(
        (val: string) => {
            if (value.includes(val)) {
                onValueChange(value.filter((item) => item !== val));
            } else {
                onValueChange([...value, val]);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value]
    );

    // Stable – reads inputValue via ref so it has no deps that change on every keystroke.
    const handleSelect = useCallback(
        (e: React.SyntheticEvent<HTMLInputElement>) => {
            e.preventDefault();
            const target = e.currentTarget;
            const selection = target.value.substring(
                target.selectionStart ?? 0,
                target.selectionEnd ?? 0
            );
            setSelectedValue(selection);
            setIsValueSelected(selection === inputValueRef.current);
        },
        []
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            e.stopPropagation();
            const target = inputRef.current;

            if (!target) return;

            const moveNext = () => {
                const nextIndex = activeIndex + 1;
                setActiveIndex(
                    nextIndex > value.length - 1 ? (loop ? 0 : -1) : nextIndex
                );
            };

            const movePrev = () => {
                const prevIndex = activeIndex - 1;
                setActiveIndex(prevIndex < 0 ? value.length - 1 : prevIndex);
            };

            const moveCurrent = () => {
                const newIndex =
                    activeIndex - 1 <= 0
                        ? value.length - 1 === 0
                            ? -1
                            : 0
                        : activeIndex - 1;
                setActiveIndex(newIndex);
            };

            switch (e.key) {
                case "ArrowLeft":
                    if (dir === "rtl") {
                        if (value.length > 0 && (activeIndex !== -1 || loop)) {
                            moveNext();
                        }
                    } else {
                        if (value.length > 0 && target.selectionStart === 0) {
                            movePrev();
                        }
                    }
                    break;

                case "ArrowRight":
                    if (dir === "rtl") {
                        if (value.length > 0 && target.selectionStart === 0) {
                            movePrev();
                        }
                    } else {
                        if (value.length > 0 && (activeIndex !== -1 || loop)) {
                            moveNext();
                        }
                    }
                    break;

                case "Backspace":
                case "Delete":
                    if (value.length > 0) {
                        if (activeIndex !== -1 && activeIndex < value.length) {
                            onValueChangeHandler(value[activeIndex]);
                            moveCurrent();
                        } else {
                            if (target.selectionStart === 0) {
                                if (
                                    selectedValueRef.current === inputValueRef.current ||
                                    isValueSelectedRef.current
                                ) {
                                    onValueChangeHandler(value[value.length - 1]);
                                }
                            }
                        }
                    }
                    break;

                case "Enter":
                    setOpen(true);
                    break;

                case "Escape":
                    if (activeIndex !== -1) {
                        setActiveIndex(-1);
                    } else if (open) {
                        setOpen(false);
                    }
                    break;

                default:
                    // If a badge is focused and a printable key is pressed, return
                    // focus to the text input so the character is not swallowed.
                    if (e.key.length === 1 && activeIndex !== -1) {
                        setActiveIndex(-1);
                        target.focus();
                    }
                    break;
            }
        },
        [value, activeIndex, loop, open, onValueChangeHandler]
    );

    // Memoised context object. Deps intentionally exclude inputValue – it lives in
    // MultiSelectSearchContext instead. This means MultiSelectorItem only re-renders
    // when the actual selection or navigation state changes, not on every keystroke.
    const contextValue = useMemo<MultiSelectContextProps>(
        () => ({
            value,
            onValueChange: onValueChangeHandler,
            options,
            open,
            setOpen,
            setInputValue: setInputValueAndNotify,
            activeIndex,
            setActiveIndex,
            ref: inputRef as React.RefObject<HTMLInputElement>,
            handleSelect,
        }),
        [value, onValueChangeHandler, options, open, activeIndex, handleSelect, setInputValueAndNotify]
    );

    return (
        <MultiSelectSearchContext.Provider value={inputValue}>
            <MultiSelectContext.Provider value={contextValue}>
                {/* shouldFilter=false: cmdk's O(n) fuzzy scoring pass is disabled.
                    Filtering is handled by the parent via onSearchChange. */}
                <Command
                    onKeyDown={handleKeyDown}
                    shouldFilter={false}
                    className={cn(
                        "overflow-visible bg-transparent flex flex-col space-y-2",
                        className
                    )}
                    dir={dir}
                    {...props}
                >
                    {children}
                </Command>
            </MultiSelectContext.Provider>
        </MultiSelectSearchContext.Provider>
    );
};

const MultiSelectorTrigger = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value, onValueChange, activeIndex, options } = useMultiSelect();

    const mousePreventDefault = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    return (
        <div
            ref={ref}
            className={cn(
                "flex flex-wrap gap-1 p-1 py-2 ring-1 ring-muted rounded-lg bg-background",
                {
                    "ring-1 focus-within:ring-ring": activeIndex === -1,
                },
                className
            )}
            {...props}
        >
            {value.map((item, index) => (
                <Badge
                    key={item}
                    className={cn(
                        "px-1 rounded-xl flex items-center gap-1",
                        activeIndex === index && "ring-2 ring-muted-foreground "
                    )}
                    variant={"secondary"}
                >
                    <span className="text-xs">
                        {options.find((opt) => opt.value === item)?.label ||
                            item}
                    </span>
                    <button
                        aria-label={`Remove ${item} option`}
                        aria-roledescription="button to remove option"
                        type="button"
                        onMouseDown={mousePreventDefault}
                        onClick={() => onValueChange(item)}
                    >
                        <span className="sr-only">Remove {item} option</span>
                        <RemoveIcon className="h-4 w-4 hover:stroke-destructive" />
                    </button>
                </Badge>
            ))}
            {children}
        </div>
    );
});

MultiSelectorTrigger.displayName = "MultiSelectorTrigger";

const MultiSelectorInput = forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => {
    const {
        setOpen,
        setInputValue,
        activeIndex,
        setActiveIndex,
        handleSelect,
        ref: inputRef,
    } = useMultiSelect();
    // Read inputValue from the search context – this is the only component
    // that needs to re-render on every keystroke.
    const inputValue = useMultiSelectSearch();

    return (
        <CommandPrimitive.Input
            {...props}
            tabIndex={0}
            ref={inputRef}
            value={inputValue}
            onValueChange={activeIndex === -1 ? setInputValue : undefined}
            onSelect={handleSelect}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onClick={() => setActiveIndex(-1)}
            className={cn(
                "ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 text-sm",
                className,
                activeIndex !== -1 && "caret-transparent"
            )}
        />
    );
});

MultiSelectorInput.displayName = "MultiSelectorInput";

const MultiSelectorContent = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ children }, ref) => {
    const { open } = useMultiSelect();
    return (
        <div ref={ref} className="relative">
            {open && children}
        </div>
    );
});

MultiSelectorContent.displayName = "MultiSelectorContent";

const MultiSelectorList = forwardRef<
    React.ElementRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children }, ref) => {
    return (
        <CommandList
            ref={ref}
            className={cn(
                "p-2 flex flex-col gap-2 rounded-md scrollbar-thin scrollbar-track-transparent transition-colors scrollbar-thumb-muted-foreground dark:scrollbar-thumb-muted scrollbar-thumb-rounded-lg w-full absolute bg-background shadow-md z-10 border border-muted top-0",
                className
            )}
        >
            {children}
            <CommandEmpty>
                <span className="text-muted-foreground">No results found</span>
            </CommandEmpty>
        </CommandList>
    );
});

MultiSelectorList.displayName = "MultiSelectorList";

const MultiSelectorItem = forwardRef<
    React.ElementRef<typeof CommandPrimitive.Item>,
    { value: string } & React.ComponentPropsWithoutRef<
        typeof CommandPrimitive.Item
    >
>(({ className, value, children, ...props }, ref) => {
    // Deliberately does NOT consume MultiSelectSearchContext.
    // This component only re-renders when the selected set changes.
    const { value: Options, onValueChange, setInputValue } = useMultiSelect();

    const mousePreventDefault = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const isIncluded = Options.includes(value);
    return (
        <CommandItem
            ref={ref}
            {...props}
            onSelect={() => {
                onValueChange(value);
                setInputValue("");
            }}
            className={cn(
                "rounded-md cursor-pointer px-2 py-1 transition-colors flex justify-between ",
                className,
                isIncluded && "opacity-50 cursor-default",
                props.disabled && "opacity-50 cursor-not-allowed"
            )}
            onMouseDown={mousePreventDefault}
        >
            {children}
            {isIncluded && <Check className="h-4 w-4" />}
        </CommandItem>
    );
});

MultiSelectorItem.displayName = "MultiSelectorItem";

export {
    MultiSelector,
    MultiSelectorTrigger,
    MultiSelectorInput,
    MultiSelectorContent,
    MultiSelectorList,
    MultiSelectorItem,
};
