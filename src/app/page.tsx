import { getSessionData } from "../lib/session";
import { redirect } from "next/navigation";
import HomePage from "./HomePage";
import { userRedirectPath } from "@/lib/utilities";
import { Resident } from "@/lib/types";

export default async function Page() {
    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionData = await getSessionData<Resident>();

    if (sessionData == null) {
        redirect("/login");
    }

    if (sessionData.user.type !== "resident") {
        redirect(userRedirectPath(sessionData.user.type));
    }

    return <HomePage sessionData={sessionData} today={today} tomorrow={tomorrow} />;
}
