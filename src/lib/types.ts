import { Status, Trooper } from "@/db/schema";
import { Billet, UnitElement } from "@/db/schema";

export interface TrooperProfileBilletResponse {
    billet: Billet;
    unitElement: UnitElement;
    superiorTrooper: Trooper | null;
}

export interface PlayerQualificationsResponse {
    qualificationId: number;
    earnedDate: string;
}

export interface EditTrooper {
    id: string;
    numbers: number;
    name: string;
    rank: number;
    billetId: string | null;
    recruitmentDate: string;
    status: Status;
    departmentPositions: string[];
}

export enum RankLevel {
    JNCO = "JNCO",
    SNCO = "SNCO",
    Company = "Company",
    Command = "Command",
}
