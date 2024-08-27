export const dynamic = "force-dynamic";

import { CountPage } from "./ListPage";
import { getSessionData } from "@/lib/session";
import { Manager } from "@/lib/types";
import { redirect } from "next/navigation";
import { userRedirectPath } from "@/lib/utilities";
import { getMetadata } from "@/lib/database";

export default async function Page() {
    const sessionData = await getSessionData<Manager>();
    if (sessionData == null) {
        redirect("/login");
    }
    if (sessionData.user.type !== "manager") {
        redirect(userRedirectPath(sessionData.user.type));
    }
    const today = new Date();
    const { hostels } = await getMetadata();

    return <CountPage sessionData={sessionData} hostelIds={Object.keys(hostels)} hostels={hostels} today={today} />;
}
