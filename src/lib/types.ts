import { EventKind, EventTypes, OperationType, Status, Trooper } from "@/db/schema";
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

export interface TrooperBasicInfo {
    id: string;
    name: string;
    numbers: number;
    rank: number;
}

export interface QualificationBasicInfo {
    id: string;
    name: string;
    abbreviation: string;
}

export interface TrainingEntry {
    trainees: TrooperBasicInfo[];
    trainer: TrooperBasicInfo | null;
    id: string;
    qualification: QualificationBasicInfo;
    trainingDate: string;
    trainingNotes: string | null;
}

export interface OperationEntry {
    id: string;
    zeus: TrooperBasicInfo;
    cozeus: TrooperBasicInfo[];
    attendees: TrooperBasicInfo[];
    eventType: EventTypes;
    eventDate: string;
    eventNotes: string;
}

export interface EventEntry {
    id: string;
    name: string;
    description: string | null;
    bannerImage?: string | null;
    eventDate: string;
    eventTime: string | null;
    eventKind: EventKind;
    campaignId?: string | null;
    operation?: {
        id: string;
        eventId: string;
        operationType: OperationType;
        transmittedById: string | null;
        deployedForces: string[] | null;
        objectives: Array<{ title: string; description: string }> | null;
        situationReport: string | null;
        eventNotes: string | null;
        attendanceId: string | null;
    } | null;
    trainingEvent?: {
        id: string;
        eventId: string;
        qualificationId: string | null;
        scheduledTrainerId: string | null;
        trainingCompletionId: string | null;
    } | null;
}
export interface EventAttendanceData {
    id: string;
    trooperId: string;
    trooper: TrooperBasicInfo;
    billetId: string | null;
    billetRole: string | null;
    billetPriority: number;
    unitElementName: string | null;
    unitElementParentId: string | null;
    unitElementId: string | null;
    unitElementPriority: number | null;
}