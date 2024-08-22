"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Checkbox, CheckboxGroup, Switch } from "@nextui-org/react";
import { CookieSessionData, MealStatus, MealType, Resident } from "../../lib/types";
import { getResidentMarkings, updateResidentMarkings } from "../../lib/database";
import { MEAL_TYPES } from "../../lib/constants";
import toast from "react-hot-toast";

interface MealEditorModalProps {
    onClose: () => void;
    selectedDate: Date;
    sessionData: CookieSessionData<Resident>;
    editable: boolean;
}

export function MealEditorModal({ onClose, selectedDate, sessionData, editable }: MealEditorModalProps) {
    const thisDate = useMemo(() => {
        return {
            day: selectedDate.getDate(),
            month: selectedDate.getMonth(),
            year: selectedDate.getFullYear(),
        };
    }, [selectedDate]);
    const sessionResident = useMemo(() => {
        return {
            id: sessionData.user._id,
            hostel: sessionData.user.hostel,
            name: sessionData.user.name,
        };
    }, [sessionData]);

    const [previouslySelectedMeals, setPreviouslySelectedMeals] = useState<string[]>([
        "breakfast",
        "lunch",
        "dinner",
        "snacks",
    ] as MealType[]);
    const [selectedMeals, setSelectedMeals] = useState<string[]>(previouslySelectedMeals);
    const [isOptedIn, setIsOptedIn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingStatus, setLoadingStatus] = useState("Loading...");

    const dateDisplay = Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        weekday: "long",
    }).format(selectedDate);

    useEffect(() => {
        setSelectedMeals(isOptedIn ? ["breakfast", "dinner", "lunch", "snacks"] : []);
    }, [isOptedIn]);

    useEffect(() => {
        setIsOptedIn(MEAL_TYPES.some((meal) => selectedMeals.includes(meal)));
    }, [selectedMeals]);

    useEffect(() => {
        setIsLoading(true);

        // prevent scrolling
        document.body.style.overflow = "hidden";

        getResidentMarkings(thisDate, sessionResident)
            .then((markings) => {
                const day = markings[0];
                const meals = Object.keys(day.meals).filter((meal) => day.meals[meal as MealType]);
                setSelectedMeals(meals);
                setPreviouslySelectedMeals(meals);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setLoadingStatus("Error occurred while fetching data.");
            })
            .finally(() => {
                setIsLoading(false);
            });

        return () => {
            // reset the ability to scroll
            document.body.style.overflow = "unset";
        };
    }, [sessionResident, thisDate]);

    return (
        <div
            className="z-[1] w-full h-full left-0 top-0 fixed overflow-auto bg-black bg-opacity-20 transition-all ease-in"
            onClick={onClose}
        >
            <div
                className="bg-white border-2 bottom-0 w-full fixed m-auto border-black"
                onClick={(event) => event.stopPropagation()}
            >
                {isLoading ? (
                    <div className="text-center p-8">{loadingStatus}</div>
                ) : (
                    <div className="flex flex-col max-w-screen-md mx-auto p-8 text-base space-y-6">
                        <div className="flex justify-between text-2xl font-bold my-2">
                            <div>{dateDisplay}</div>
                            <div className="cursor-pointer" onClick={onClose}>
                                &times;
                            </div>
                        </div>
                        <div className="mb-4">
                            <Switch
                                defaultSelected
                                size="sm"
                                isSelected={isOptedIn}
                                onValueChange={setIsOptedIn}
                                isDisabled={!editable}
                            >
                                <span className="text-base">Opt-in for mess</span>
                            </Switch>
                        </div>
                        <p>
                            You can check the following fields to individually opt-out from a meal of the selected day:
                        </p>
                        <div>
                            <CheckboxGroup
                                label="Select meals"
                                value={selectedMeals}
                                onValueChange={setSelectedMeals}
                                isDisabled={!editable || !isOptedIn}
                            >
                                <Checkbox value="breakfast">Breakfast</Checkbox>
                                <Checkbox value="lunch">Lunch</Checkbox>
                                <Checkbox value="snacks">Tea & Snacks</Checkbox>
                                <Checkbox value="dinner">Dinner</Checkbox>
                            </CheckboxGroup>
                        </div>
                        <ChangesApplyButton
                            editable={editable}
                            selectedMeals={selectedMeals}
                            previouslySelectedMeals={previouslySelectedMeals}
                            onClick={(setIsProcessing) => {
                                setIsProcessing(true);
                                const updatedMealStatus = MEAL_TYPES.reduce(
                                    (p, meal) => ({ ...p, [meal]: selectedMeals.includes(meal) }),
                                    {} as MealStatus
                                );
                                updateResidentMarkings(thisDate, sessionResident, updatedMealStatus)
                                    .then(() => {
                                        toast.success("Updated sucessfully");
                                        setPreviouslySelectedMeals(selectedMeals);
                                    })
                                    .catch(() => toast.error("Failed to update"))
                                    .finally(() => setIsProcessing(false));
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function ChangesApplyButton(props: {
    editable: boolean;
    selectedMeals: string[];
    previouslySelectedMeals: string[];
    onClick: (setProcessing: Dispatch<SetStateAction<boolean>>) => void;
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const isSame =
        props.selectedMeals.length === props.previouslySelectedMeals.length &&
        props.selectedMeals.every((meal) => props.previouslySelectedMeals.includes(meal));

    if (!props.editable) {
        return (
            <div className="cursor-not-allowed w-full rounded-md text-center p-4 font-semibold bg-gray-300 text-gray-500 shadow-inner italic">
                Can&lsquo;t change the past.
            </div>
        );
    }

    return (
        <button
            disabled={isProcessing || isSame}
            className="cursor-pointer w-full rounded-md bg-black text-white text-center p-4 font-semibold disabled:bg-gray-300 disabled:text-gray-500 shadow-inner"
            onClick={() => props.onClick(setIsProcessing)}
        >
            {isProcessing ? "Applying..." : isSame ? "Make some changes to apply." : "Apply Changes"}
        </button>
    );
}
