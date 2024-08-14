export const dynamic = "force-dynamic";

import { getMetadata } from "@/lib/database";
import { ManagerDashboardPage } from "./Manager";

export default async function Page() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const { hostels } = await getMetadata();
    return (
        <ManagerDashboardPage
            today={today}
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
