import Orbat from "./orbat/orbat";

export default function Home() {
    return (
        <div className="w-full h-[calc(100vh-64px)] min-h-[500px]">
            <iframe
                src="https://calendar.google.com/calendar/u/0/embed?color=%23cabdbf&src=054227ad04dff56a8023d7b79adae93039a97d12f4b944e10268a50297cb2899@group.calendar.google.com"
                className="w-full h-full"
            ></iframe>
        </div>
    );
}
