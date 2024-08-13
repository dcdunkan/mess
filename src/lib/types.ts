import { HOSTELS, MEAL_TYPES } from "./constants";

type StringWithSuggestions<S extends string> = (string & Record<never, never>) | S;

// GENERAL
export type Hostel = StringWithSuggestions<keyof typeof HOSTELS>;
export type MealType = (typeof MEAL_TYPES)[number];
export type MealStatus = { [x in MealType]: boolean };

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface DatabaseMetadata {
    hostels: Record<string, string>;
}

// USERS
export type UserType = "resident" | "manager" | "superuser";
export type UserSchema = Resident | Manager | Superuser;
export interface BaseUserSchema {
    type: UserType;
    name: string;
    password: string;
}
export interface Resident extends BaseUserSchema {
    type: "resident";
    admission: string;
    hostel: Hostel;
}
export interface Manager extends BaseUserSchema {
    type: "manager";
    login: string;
}
export type Superuser = BaseUserSchema & {
    type: "superuser";
};
export interface CookieSessionData<U extends UserSchema = UserSchema> {
    user: Omit<U, "password" | "admission"> & { _id: string };
    expires: Date;
}

// MARKINGS
export type MarkingsSchema = {
    date: SelectedDate;
    resident: {
        id: string;
        hostel: string;
    };
    meals: MealStatus;
};
export type DayPreference = {
    date: SelectedDate;
    meals: MealStatus;
};
export type DayData = Record<MealType, number>;
export type UnorganizedMonthData = { day: number; data: MealStatus[] }[];

// UTILITY TYPES
export interface SelectedDate {
    day: number;
    month: number;
    year: number;
}
export interface SelectedMonth {
    year: number;
    monthIndex: number;
}
export interface MonthInfo {
    year: number;
    name: string;
    days: number;
    startDate: number;
    currentMonthIndex: number;
    prevMonthIndex: number;
    prevMonthLastDate: number;
}

export type ResidentInput = Resident & { confirmPassword: string };
