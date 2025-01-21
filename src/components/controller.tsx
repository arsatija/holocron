import { RankLevel } from "@/db/schema";
import { dict } from "@/types";
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

interface UserTrooperInfo {
    id: string;
    fullName: string;
    rankLevel: RankLevel;
    departments: string[];
}

interface ControllerContextType {
    trooperCtx: UserTrooperInfo | null;
    setTrooperCtx: (data: UserTrooperInfo | null) => void;
    additionalCtx: dict | null;
    setAdditionalCtx: (data: dict | null) => void;
}

const ControllerContext = createContext<ControllerContextType | null>(null);

export const ControllerProvider = ({ children }: { children: ReactNode }) => {
    const [trooperCtx, setTrooperCtx] = useState<UserTrooperInfo | null>(null);
    const [additionalCtx, setAdditionalCtx] = useState<dict | null>(null);

    useEffect(() => {
        const storedTrooper = localStorage.getItem("trooperCtx");
        if (storedTrooper) {
            setTrooperCtx(JSON.parse(storedTrooper));
        }
    }, []);

    useEffect(() => {
        if (trooperCtx) {
            localStorage.setItem("trooperCtx", JSON.stringify(trooperCtx));
        } else {
            localStorage.removeItem("trooperCtx");
        }
    }, [trooperCtx]);



    return (
        <ControllerContext.Provider
            value={{
                trooperCtx,
                setTrooperCtx,
                additionalCtx,
                setAdditionalCtx,
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
