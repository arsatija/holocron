import { Trooper } from "@/db/schema";
import { Billet, UnitElement } from "@/db/schema";

export interface TrooperProfileBilletResponse {
    billet: Billet;
    unitElement: UnitElement;
    superiorTrooper: Trooper | null;
}

export interface playerQualificationsResponse {
    qualificationId: number;
    earnedDate: string;
}
