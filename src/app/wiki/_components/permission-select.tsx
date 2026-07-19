"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import type { PermissionOption } from "../_lib/queries";

interface PermissionSelectProps {
    options: PermissionOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
}

// Thin wrapper around the existing MultiSelect, formatted for permission
// strings (rank levels, department scopes, qual categories, billet/position
// slugs) — values are stored raw and checked via checkPermissionsSync.
export function PermissionSelect({
    options,
    value,
    onChange,
    placeholder = "Anyone (no restriction)",
}: PermissionSelectProps) {
    const selectOptions = options.map((option) => ({
        label: `${option.group}: ${option.label}`,
        value: option.value,
    }));

    return (
        <MultiSelect
            options={selectOptions}
            value={value}
            onValueChange={onChange}
            placeholder={placeholder}
        />
    );
}
