import { CookieSessionData, Manager } from "@/lib/types";
import Link from "next/link";
import { HashIcon, ListIcon, LogOutIcon } from "lucide-react";

interface ManagerDashboardPageProps {
    sessionData: CookieSessionData<Manager>;
}

export function ManagerDashboardPage(props: ManagerDashboardPageProps) {
    return (
        <main className="flex flex-col p-8 max-w-screen-lg mx-auto space-y-10">
            <div className="space-y-1 select-none my-4">
                <div>Logged in as</div>
                <div className="font-medium text-3xl">Hostel Manager</div>
                <p>You can use this control panel to manage hostels.</p>
            </div>

            <section>
                <div className="text-2xl mb-4">Actions you can perform</div>

                <div className="hover:bg-black/5 rounded transition-all duration-150 ease-in-out">
                    <Link href={"/manager/count"}>
                        <div className="p-4 flex place-items-center justify-between select-none">
                            <div className="flex gap-4 place-items-center">
                                <HashIcon />
                                <div>
                                    <div className="text-xl">Count per hostel</div>
                                    <div>Get food count for the upcoming days.</div>
                                </div>
                            </div>
                            <div className="text-xl">&rarr;</div>
                        </div>
                    </Link>
                </div>

                <hr />

                <div className="hover:bg-black/5 rounded transition-all duration-150 ease-in-out">
                    <Link href={"/manager/list"}>
                        <div className="p-4 flex place-items-center justify-between select-none">
                            <div className="flex gap-4 place-items-center">
                                <ListIcon />
                                <div>
                                    <div className="text-xl">List of residents</div>
                                    <div>See the full list of students per hostel with monthly counts</div>
                                </div>
                            </div>
                            <div className="text-xl">&rarr;</div>
                        </div>
                    </Link>
                </div>

                <hr />

                <div className="hover:bg-black/5 rounded transition-all duration-150 ease-in-out">
                    <a href={"/logout"}>
                        <div className="p-4 flex place-items-center justify-between select-none">
                            <div className="flex gap-4 place-items-center">
                                <LogOutIcon />
                                <div>
                                    <div className="text-xl">Logout</div>
                                    <div>Log out of your account.</div>
                                </div>
                            </div>
                            <div className="text-xl">&rarr;</div>
                        </div>
                    </a>
                </div>
            </section>
        </main>
    );
}
