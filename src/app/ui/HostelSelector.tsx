import { HOSTELS } from "@/lib/constants";
import { ChangeEventHandler } from "react";

interface HostelSelectorProps {
    onChange: ChangeEventHandler<HTMLSelectElement>;
}

export function HostelSelector(props: HostelSelectorProps) {
    return (
        <select
            defaultValue={"null"}
            required
            className="border-2 bg-inherit border-black p-2.5 w-full"
            id="hostel"
            name="hostel"
            onChange={props.onChange}
        >
            <option disabled aria-disabled hidden value="null">
                Select hostel
            </option>
            {Object.entries(HOSTELS).map(([id, name]) => {
                return (
                    <option key={id} value={id}>
                        {name}
                    </option>
                );
            })}
        </select>
    );
}
