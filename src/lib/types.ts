export interface BilletResponse {
    id: string;
    name: string;
    icon: string;
    team: string | null;
    superiorBilletId: string | null;
}

export interface TrooperResponse {
    id: string;
    status: "Active" | "Inactive" | "Discharged";
    rank: number;
    numbers: number;
    name: string;
    referredBy: string | null;
    recruitmentDate: string;
    attendances: number;
}

export interface TrooperProfileBilletResponse {
    billet: BilletResponse;
    superiorBillet: BilletResponse | null;
    superiorTrooper: TrooperResponse | null;
}

export interface playerQualificationsResponse {
    qualificationId: number;
    earnedDate: string;
}
