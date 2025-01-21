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
    scopes: string[];
}

interface ControllerContextType {
    trooperCtx: UserTrooperInfo | null;
    setTrooperCtx: (data: UserTrooperInfo | null) => void;
    additionalCtx: dict | null;
    setAdditionalCtx: (data: dict | null) => void;
    isLoading: boolean;
}

const ControllerContext = createContext<ControllerContextType | null>(null);

export const ControllerProvider = ({ children }: { children: ReactNode }) => {
    const [trooperCtx, setTrooperCtx] = useState<UserTrooperInfo | null>(null);
    const [additionalCtx, setAdditionalCtx] = useState<dict | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { status } = useSession();
    useEffect(() => {
        const storedTrooper = getCookie("trooperCtx");
        if (storedTrooper) {
            setTrooperCtx(JSON.parse(storedTrooper));
        } else if (status === "authenticated") {
            console.log("redirecting to login");
            redirect("/auth/login");
        }
        setIsLoading(false);
    }, []);

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
