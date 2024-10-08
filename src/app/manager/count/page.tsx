export const dynamic = "force-dynamic";

import { getMetadata } from "@/lib/database";
import { ResidentListPage } from "./CountPage";
import { getSessionData } from "@/lib/session";
import { Manager } from "@/lib/types";
import { redirect } from "next/navigation";
import { userRedirectPath } from "@/lib/utilities";

export default async function Page() {
    const sessionData = await getSessionData<Manager>();
    if (sessionData == null) {
        redirect("/login");
    }
    if (sessionData.user.type !== "manager") {
        redirect(userRedirectPath(sessionData.user.type));
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const { hostels } = await getMetadata();

    return (
        <ResidentListPage
            today={today}
            sessionData={sessionData}
            tomorrow={{
                day: tomorrow.getDate(),
                month: tomorrow.getMonth(),
                year: tomorrow.getFullYear(),
            }}
            hostelIds={Object.keys(hostels)}
            hostels={hostels}
        />
    );
}
