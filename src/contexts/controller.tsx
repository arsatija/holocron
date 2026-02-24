import { RankLevel } from "@/db/schema";
import { dict } from "@/types";
import { deleteCookie, getCookie, setCookie } from "cookies-next/client";
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface UserTrooperInfo {
    id: string;
    fullName: string;
    rankLevel: RankLevel;
    departments: string[];
    billetSlug?: string | null;
    positionSlugs?: string[];
    billetPermissions?: string[]; // Expanded hierarchy chain for billet
    positionPermissions?: string[]; // Expanded hierarchy chains for positions
}

interface ControllerContextType {
    trooperCtx: UserTrooperInfo | null;
    setTrooperCtx: (data: UserTrooperInfo | null) => void;
    additionalCtx: dict | null;
    setAdditionalCtx: (data: dict | null) => void;
    isLoading: boolean;
    revalidateTrooperCtx: () => Promise<void>;
}

const ControllerContext = createContext<ControllerContextType | null>(null);

export const ControllerProvider = ({ children }: { children: ReactNode }) => {
    const [trooperCtx, setTrooperCtx] = useState<UserTrooperInfo | null>(null);
    const [additionalCtx, setAdditionalCtx] = useState<dict | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { status } = useSession();

    const fetchTrooperData = async () => {
        try {
            const response = await fetch("/api/auth/trooper");
            if (!response.ok) throw new Error("Failed to fetch trooper data");
            const data = await response.json();
            setTrooperCtx(data);
            setCookie("trooperCtx", JSON.stringify(data), {
                maxAge: 60 * 60 * 24 * 30,
            });
            return data;
        } catch (error) {
            console.error("Error fetching trooper data:", error);
            return null;
        }
    };

    const revalidateTrooperCtx = async () => {
        setIsLoading(true);
        await fetchTrooperData();
        setIsLoading(false);
    };

    useEffect(() => {
        const initializeTrooperCtx = async () => {
            setIsLoading(true);
            const storedTrooper = getCookie("trooperCtx");

            if (storedTrooper) {
                const parsedTrooper = JSON.parse(storedTrooper);

                // Check if cached trooper has new permission fields
                // If not, fetch fresh data to get the new fields
                const hasNewFields =
                    "billetPermissions" in parsedTrooper &&
                    "positionPermissions" in parsedTrooper;

                if (hasNewFields) {
                    setTrooperCtx(parsedTrooper);
                    setIsLoading(false);
                    return;
                }

                // Cache is outdated, fetch fresh data if authenticated
                if (status === "authenticated") {
                    await fetchTrooperData();
                }
                setIsLoading(false);
                return;
            }

            if (status === "authenticated") {
                await fetchTrooperData();
            }

            setIsLoading(false);
        };

        initializeTrooperCtx();
    }, [status]);

    useEffect(() => {
        if (trooperCtx) {
            setCookie("trooperCtx", JSON.stringify(trooperCtx));
        } else {
            deleteCookie("trooperCtx");
        }
    }, [trooperCtx]);

    return (
        <ControllerContext.Provider
            value={{
                trooperCtx,
                setTrooperCtx,
                additionalCtx,
                setAdditionalCtx,
                isLoading,
                revalidateTrooperCtx,
            }}
        >
            {children}
        </ControllerContext.Provider>
    );
};

export const useController = () => {
    const context = useContext(ControllerContext);
    if (!context) {
        throw new Error(
            "useController must be used within a ControllerProvider"
        );
    }
    return context;
};
