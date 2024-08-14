"use server";

import { getMetadata } from "@/lib/database";

export async function GET() {
    const metadata = await getMetadata();
    return Response.json(metadata);
}
