export type unit_dict = {
    [key: number]: { name: string; abbreviation: string };
};

export const ranks: unit_dict = {
    1: { name: "Clone Commander", abbreviation: "CC" },
    2: { name: "Clone Captain", abbreviation: "CC" },
    3: { name: "Chief Warrant Officer", abbreviation: "CWO" },
    4: { name: "Clone First Lieutenant", abbreviation: "CC" },
    5: { name: "Clone Second Lieutenant", abbreviation: "CL" },
    6: { name: "Clone Squadron Commander", abbreviation: "CXO" },
    7: { name: "Clone Warrant Officer Grade 5", abbreviation: "CW" },
    8: { name: "Clone Sergeant", abbreviation: "CS" },
    9: { name: "Clone Flight Officer", abbreviation: "CXS" },
    10: { name: "Clone Warrant Officer Grade 4", abbreviation: "CW" },
    11: { name: "Clone Corporal", abbreviation: "CP" },
    12: { name: "Jr Clone Flight Officer", abbreviation: "CXP" },
    13: { name: "Clone Warrant Officer Grade 3", abbreviation: "CW" },
    14: { name: "Clone Lance Corporal", abbreviation: "CLC" },
    15: { name: "Clone Warrant Officer Grade 2", abbreviation: "CW" },
    16: { name: "Clone Specialist", abbreviation: "CSP" },
    17: { name: "Clone Ensign", abbreviation: "CXX" },
    18: { name: "Clone Warrant Officer Grade 1", abbreviation: "CW" },
    19: { name: "Veteran Clone Trooper", abbreviation: "VCT" },
    20: { name: "Clone Aviator", abbreviation: "CX" },
    21: { name: "Senior Clone Trooper", abbreviation: "SCT" },
    22: { name: "Clone Aviator Cadet", abbreviation: "CXC" },
    23: { name: "Clone Trooper", abbreviation: "CT" },
    24: { name: "Clone Recruit", abbreviation: "CR" },
};

export const qualifications: unit_dict = {
    1: {
        name: "Basic Training",
        abbreviation: "BT",
    },
    2: {
        name: "Auto-Rifleman",
        abbreviation: "AR",
    },
    3: {
        name: "Anti-Tank",
        abbreviation: "AT",
    },
    4: {
        name: "Marksman",
        abbreviation: "MRK",
    },
    5: {
        name: "Combat Life Saver",
        abbreviation: "CLS",
    },
    6: {
        name: "Close Quarters Combatant",
        abbreviation: "CQC",
    },
    7: {
        name: "Grenadier",
        abbreviation: "GRN",
    },
    8: {
        name: "Airborne",
        abbreviation: "ABR",
    },
    9: {
        name: "Demolition Specialist",
        abbreviation: "DEMO",
    },
    10: {
        name: "Medic",
        abbreviation: "MED",
    },
    11: {
        name: "Basic Leadership Course",
        abbreviation: "BLC",
    },
    12: {
        name: "Advance Leadership Course",
        abbreviation: "ALC",
    },
    13: {
        name: "Command Leadership Course",
        abbreviation: "CLC",
    },
    14: {
        name: "Detachment Leadership Course",
        abbreviation: "DLC",
    },
    15: {
        name: "Rotary Wing",
        abbreviation: "RTW",
    },
    16: {
        name: "Fixed Wing",
        abbreviation: "FXW",
    },
    17: {
        name: "Advance Recon Commandos",
        abbreviation: "ARC",
    },
    18: {
        name: "Advance Recon Force",
        abbreviation: "ARF",
    },
    19: {
        name: "Republic Commando",
        abbreviation: "RCM",
    },
    20: {
        name: "Radio Telephone Operator",
        abbreviation: "RTO",
    },
};
