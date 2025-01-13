import AddAttendanceForm from "./_components/add-attendance-form";

export default function AdminPage() {
    return (
        <div className="p-4 grid grid-cols-2 gap-4">
            <AddAttendanceForm />
        </div>
    );
}
