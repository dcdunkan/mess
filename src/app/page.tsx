import { redirect } from "next/navigation";
import HomePage from "./HomePage";
import { userRedirectPath } from "@/lib/utilities";
import { CookieSessionData, Resident } from "@/lib/types";
import { verifySession } from "@/lib/session-verification";

export default async function Page() {
    const today = new Date();
    const session = (await verifySession()) as unknown as {
        user: CookieSessionData<Resident>;
    };

    if (session.user.type !== "resident") {
        return <>Unauthorized</>;
    }

    return <HomePage sessionData={session.user} today={today} />;
}
