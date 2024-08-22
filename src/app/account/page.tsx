import { getSessionData } from "../../lib/session";
import { redirect } from "next/navigation";
import { userRedirectPath } from "@/lib/utilities";
import { Resident } from "@/lib/types";
import AccountPage from "./AccountPage";
import { doesResidentExists, getMetadata } from "@/lib/database";

export default async function Page() {
    const sessionData = await getSessionData<Resident>();

    if (sessionData == null) redirect("/login");

    if (sessionData.user.type !== "resident") {
        redirect(userRedirectPath(sessionData.user.type));
    }

    if (!(await doesResidentExists(sessionData.user.admission))) {
        redirect("/logout");
    }

    const { hostels } = await getMetadata();

    return <AccountPage sessionData={sessionData} hostels={hostels} />;
}
