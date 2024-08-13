"use server";

import { MongoClient, WithId } from "mongodb";
import {
    Resident,
    SelectedDate,
    MarkingsSchema,
    UserSchema,
    MealStatus,
    DayPreference,
    UserType,
    Hostel,
    MealType,
    MonthData,
    DayData,
} from "./types";
import { hash, compare } from "bcrypt";
import { ReasonedError } from "./utilities";
import { MEAL_TYPES } from "./constants";

const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI == null) {
    throw new Error("MongoDB URI is not set.");
}

const client = new MongoClient(MONGODB_URI);
const connection = client.connect();
const database = client.db("hostel");

const users = database.collection<UserSchema>("users");
const markings = database.collection<MarkingsSchema>("markings");

// export async function reg() {
//     const hashedPassword = await hash("abcdef", 10);
//     const result = await users.insertOne({
//         type: "manager",
//         name: "Annexe Manager",
//         login: "annexe-manager",
//         password: hashedPassword,
//         hostel: "annexe-v",
//     });
//     console.log("registered");
// }

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

export async function getUser(details: {
    login: string;
    password: string;
    type: UserType;
    hostel?: Hostel;
}): Promise<WithId<UserSchema>> {
    await connection;
    const user = await users.findOne(
        details.type === "manager"
            ? { type: details.type, login: details.login, hostel: details.hostel }
            : { type: details.type, admission: details.login }
    );
    if (user == null) throw new ReasonedError("Couldn't find a resident with the credentials");
    const match = await compare(details.password, user.password);
    if (!match) throw new ReasonedError("Wrong credentials");
    return user;
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

export async function getNegativeDayCount(
    filters: {
        date: SelectedDate;
        hostel: Hostel;
    },
    total: number
): Promise<DayData> {
    await connection;
    const collectiveDayData = await markings
        .aggregate<{ day: number; data: MealStatus[] }>([
            {
                $match: {
                    "resident.hostel": filters.hostel,
                    "date.year": filters.date.year,
                    "date.month": filters.date.month,
                    "date.day": filters.date.day,
                },
            },
            { $group: { _id: "$date.day", data: { $push: "$meals" } } },
            { $project: { _id: 0, data: 1, day: "$_id" } },
        ])
        .toArray();
    if (collectiveDayData.length > 1) {
        throw new ReasonedError("Unexpected situtation occurred.");
    }
    return (
        transformMonthlyData(collectiveDayData, total)[filters.date.day] ??
        prepareDefaultMealCount(total)
    );
}

export async function getResidentCount(hostel: Hostel) {
    return await users.countDocuments({ type: "resident", hostel: hostel });
}

export async function getNegativeMonthlyCount(
    filters: {
        date: Omit<SelectedDate, "day">;
        hostel: Hostel;
    },
    total: number
): Promise<MonthData> {
    await connection;
    const monthlyRecordedData = await markings
        .aggregate<{ day: number; data: MealStatus[] }>([
            {
                $match: {
                    "resident.hostel": filters.hostel,
                    "date.year": filters.date.year,
                    "date.month": filters.date.month,
                },
            },
            { $group: { _id: "$date.day", data: { $push: "$meals" } } },
            { $project: { _id: 0, data: 1, day: "$_id" } },
        ])
        .toArray();
    return transformMonthlyData(monthlyRecordedData, total);
}

function prepareDefaultMealCount(defaultCount: number) {
    return MEAL_TYPES.reduce(
        (prev, meal) => ({ ...prev, [meal]: defaultCount }),
        {} as Record<MealType, number>
    );
}

function transformMonthlyData(
    monthlyData: { day: number; data: MealStatus[] }[],
    totalResidents: number
) {
    return monthlyData.reduce((prev, dayData) => {
        return {
            ...prev,
            [dayData.day]: dayData.data.reduce((prev, status) => {
                for (const _meal in status) {
                    const meal = _meal as MealType;
                    prev[meal] -= status[meal] ? 0 : 1;
                }
                return prev;
            }, prepareDefaultMealCount(totalResidents)),
        };
    }, {} as Record<number, Record<MealType, number>>);
}

export async function updateResidentMarkings(
    date: SelectedDate,
    resident: { id: string; hostel: string },
    updated: MealStatus
) {
    await connection;
    await markings.updateOne(
        { date, resident },
        { $set: { date, resident, meals: updated } },
        { upsert: true }
    );
}
