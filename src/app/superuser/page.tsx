import { getSessionData } from "@/lib/session";
import { SuperuserPage } from "./SuperuserPage";
import { Superuser } from "@/lib/types";
import { redirect } from "next/navigation";
import { userRedirectPath } from "@/lib/utilities";
import { getMetadata } from "@/lib/database";

export default async function Page() {
    const sessionData = await getSessionData<Superuser>();
    if (sessionData == null) {
        redirect("/login");
    }
    if (sessionData.user.type !== "superuser") {
        redirect(userRedirectPath(sessionData.user.type));
    }
    return <SuperuserPage metadata={await getMetadata()} />;
}
