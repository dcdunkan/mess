export const dynamic = "force-dynamic";

import { SuperuserPage } from "./SuperuserPage";
import { getMetadata } from "@/lib/database";

export default async function Page() {
    const metadata = await getMetadata();
    return <SuperuserPage metadata={metadata} />;
}
