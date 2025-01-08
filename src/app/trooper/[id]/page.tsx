import { getTrooper } from "./queries"

interface trooperParams {
    id: string
}

export default async function Trooper(props: { params: trooperParams }) {
    const trooperParams = await props.params;
    const trooper = await getTrooper(trooperParams.id);

    return (
        <div>
           <p>{JSON.stringify(trooper)}</p>
        </div>
    );
}