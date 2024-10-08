export const dynamic = "force-dynamic";

import { ManagerDashboardPage } from "./Manager";
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
    return <ManagerDashboardPage sessionData={sessionData} />;
}
