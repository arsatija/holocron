import { getAttendancesByTrooperId, populateTrooperAttendances } from "@/services/attendances";

export async function testAttendance() {
    const attendances = await getAttendancesByTrooperId("cde5ddaf-463b-4b3b-bf46-45fa18b86a1b");
    console.log(attendances);
}

export async function testPopulateTrooperAttendances() {
    const attendances = await populateTrooperAttendances("cde5ddaf-463b-4b3b-bf46-45fa18b86a1b");
    console.log(attendances);
}

await testAttendance();
await testPopulateTrooperAttendances();