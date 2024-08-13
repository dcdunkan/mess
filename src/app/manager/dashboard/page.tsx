import {
    getNegativeMonthlyCount,
    getNegativeDayCount,
    getResidentMarkings,
    getResidentCount,
} from "@/lib/database";
import { ManagerDashboardPage } from "./ManagerDashboard";
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

    const totalResidents = await getResidentCount(sessionData.user.hostel);
    const tomorrowData = await getNegativeDayCount(
        {
            hostel: sessionData.user.hostel,
            date: {
                day: tomorrow.getDate(),
                month: tomorrow.getMonth(),
                year: tomorrow.getFullYear(),
            },
        },
        totalResidents
    );

    return (
        <ManagerDashboardPage
            today={today}
            sessionData={sessionData}
            tomorrow={tomorrow}
            tomorrowData={tomorrowData}
            totalResidents={totalResidents}
        />
    );
}
