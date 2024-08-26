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
import { isPastDay, ReasonedError } from "./utilities";

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI == null) {
    throw new Error("MongoDB URI is not set.");
}

const client = new MongoClient(MONGODB_URI);
const database = client.db("hostel");

const users = database.collection<UserSchema>("users");
const metadata = database.collection<DatabaseMetadata>("metadata");
const markings = database.collection<MarkingsSchema>("markings");

export async function getMetadata(): Promise<DatabaseMetadata> {
    await client.connect();
    const data = await metadata.findOne({ metadata: true }, { projection: { _id: 0 } });
    if (data == null) return { hostels: {} };
    return data;
}

export async function updateHostels(hostels: Record<string, string>) {
    await client.connect();
    await metadata.updateOne({ metadata: true }, { $set: { hostels } }, { upsert: true });
}

export async function doesResidentExists(admission: string): Promise<boolean> {
    await client.connect();
    const user = await users.findOne({ type: "resident", admission: admission });
    return user != null;
}

export async function getResident(details: { admission: string; password: string }): Promise<WithId<Resident>> {
    await client.connect();
    const user = await users.findOne({ type: "resident", admission: details.admission });
    if (user == null) throw new ReasonedError("Couldn't find a resident with the credentials");
    const match = await compare(details.password, user.password);
    if (!match) throw new ReasonedError("Wrong credentials");
    return user as WithId<Resident>;
}

export async function updatePassword(details: {
    admission: string;
    currentPassword: string;
    newPassword: string;
}): Promise<boolean> {
    await client.connect();
    const user = await users.findOne({ type: "resident", admission: details.admission });
    if (user == null) throw new ReasonedError("Something went wrong!");
    const currentPasswordMatch = await compare(details.currentPassword, user.password);
    if (!currentPasswordMatch) throw new ReasonedError("Current password is wrong.");
    const newPasswordMatch = await compare(details.newPassword, user.password);
    if (newPasswordMatch) throw new ReasonedError("Newer password can't be the same as the current one.");
    const hashedNewPassword = await hash(details.newPassword, 10);
    await users.findOneAndUpdate(
        { type: "resident", admission: details.admission, password: user.password },
        { $set: { password: hashedNewPassword } }
    );
    return true;
}

export async function getResidentMarkings(
    date: Partial<SelectedDate>,
    resident: { id: string; hostel: string }
): Promise<{ date: SelectedDate; meals: MealStatus }[]> {
    await client.connect();
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
    await client.connect();
    return await users.countDocuments({ type: "resident", hostel });
}

export async function getNegativeMonthlyCount(filters: {
    date: Optional<SelectedDate, "day">;
    hostel: string;
}): Promise<UnorganizedMonthData> {
    await client.connect();
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

// TODO: if all the meal preferences are restored, delete the entry.
export async function updateResidentMarkings(
    date: SelectedDate,
    resident: { id: string; hostel: string; name: string },
    updated: MealStatus
) {
    await client.connect();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const selectedDate = new Date(date.year, date.month, date.day);
    const isPastModifiableTime =
        isPastDay(selectedDate, today) || (today.getHours() >= 22 && isPastDay(selectedDate, tomorrow));

    if (isPastModifiableTime) {
        throw new Error("Preferences cannot be edited for the day anymore.");
    }

    await markings.updateOne({ date, resident }, { $set: { date, resident, meals: updated } }, { upsert: true });
}
