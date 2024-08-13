import { getMetadata } from "@/lib/database";
import { RegisterPage } from "./RegisterPage";

export default async function Page() {
    const { hostels } = await getMetadata();
    return <RegisterPage hostels={hostels} />;
}
