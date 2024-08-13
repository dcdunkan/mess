"use server";

import { MongoClient, WithId } from "mongodb";
import {
    Resident,
    SelectedDate,
    MarkingsSchema,
    UserSchema,
    MealStatus,
    UnorganizedMonthData,
    DatabaseMetadata,
    Optional,
} from "./types";
import { hash, compare } from "bcrypt";
import { ReasonedError } from "./utilities";

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI == null) {
    throw new Error("MongoDB URI is not set.");
}

const client = new MongoClient(MONGODB_URI);
const connection = client.connect();
const database = client.db("hostel");

const users = database.collection<UserSchema>("users");
const metadata = database.collection<DatabaseMetadata>("metadata");
const markings = database.collection<MarkingsSchema>("markings");

export async function getMetadata(): Promise<DatabaseMetadata> {
    const data = await metadata.findOne({ metadata: true }, { projection: { _id: 0 } });
    if (data == null) return { hostels: {} };
    return data;
}

export async function updateHostels(hostels: Record<string, string>) {
    await metadata.updateOne({ metadata: true }, { $set: { hostels } }, { upsert: true });
}

export async function registerResident(resident: Resident) {
    await connection;
    if ((await users.findOne({ admission: resident.admission })) != null) {
        throw new ReasonedError("Resident with the same admission number already exists");
    }
    try {
        const hashedPassword = await hash(resident.password, 10);
        const result = await users.insertOne({
            type: "resident",
            name: resident.name,
            admission: resident.admission,
            password: hashedPassword,
            hostel: resident.hostel,
        });
        return result.insertedId.toString();
    } catch (error) {
        throw new ReasonedError("Server error: failed to register resident");
    }
}

export async function getResident(details: { admission: string; password: string }): Promise<WithId<Resident>> {
    await connection;
    const user = await users.findOne({ type: "resident", admission: details.admission });
    if (user == null) throw new ReasonedError("Couldn't find a resident with the credentials");
    const match = await compare(details.password, user.password);
    if (!match) throw new ReasonedError("Wrong credentials");
    return user as WithId<Resident>;
}

// TODO: overload for monthly/day
export async function getResidentMarkings(
    date: Partial<SelectedDate>,
    resident: { id: string; hostel: string }
): Promise<{ date: SelectedDate; meals: MealStatus }[]> {
    await connection;
    const result = await markings
        .find(
            {
                "date.year": date.year,
                "date.month": date.month,
                ...(date.day != null ? { "date.day": date.day } : {}),
                "resident.hostel": resident.hostel,
                "resident.id": resident.id,
            },
            { projection: { _id: 0, date: 1, meals: 1 } }
        )
        .sort({ "date.day": 1 })
        .toArray();
    return result;
}

export async function getTotalResidents(hostel: string) {
    return await users.countDocuments({ type: "resident", hostel });
}

export async function getNegativeMonthlyCount(filters: {
    date: Optional<SelectedDate, "day">;
    hostel: string;
}): Promise<UnorganizedMonthData> {
    await connection;
    const monthlyRecordedData = await markings
        .aggregate<UnorganizedMonthData[number]>([
            {
                $match: {
                    "resident.hostel": filters.hostel,
                    "date.year": filters.date.year,
                    "date.month": filters.date.month,
                    ...(typeof filters.date.day === "number" ? { "date.day": filters.date.day } : {}),
                },
            },
            { $group: { _id: "$date.day", data: { $push: "$meals" } } },
            { $project: { _id: 0, data: 1, day: "$_id" } },
        ])
        .toArray();
    return monthlyRecordedData;
}

export async function updateResidentMarkings(
    date: SelectedDate,
    resident: { id: string; hostel: string },
    updated: MealStatus
) {
    await connection;
    await markings.updateOne({ date, resident }, { $set: { date, resident, meals: updated } }, { upsert: true });
}
