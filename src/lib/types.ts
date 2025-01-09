import { Player } from "@/db/schema";
import { Billet, UnitElement } from "@/db/schema";

export interface TrooperProfileBilletResponse {
    billet: Billet;
    unitElement: UnitElement;
    superiorTrooper: Player | null;
}

export interface playerQualificationsResponse {
    qualificationId: number;
    earnedDate: string;
}
