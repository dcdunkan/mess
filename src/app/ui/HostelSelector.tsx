import { ChangeEventHandler } from "react";

interface HostelSelectorProps {
    hostels: Record<string, string>;
    onChange: ChangeEventHandler<HTMLSelectElement>;
    disabled: boolean;
}

export function HostelSelector(props: HostelSelectorProps) {
    return (
        <select
            defaultValue={"null"}
            required
            className="border-2 bg-inherit p-2.5 w-full disabled:bg-gray-200 disabled:text-gray-500"
            id="hostel"
            name="hostel"
            onChange={props.onChange}
            disabled={props.disabled}
        >
            <option disabled aria-disabled hidden value="null">
                Select hostel
            </option>
            {Object.entries(props.hostels).map(([id, name]) => {
                return (
                    <option key={id} value={id}>
                        {name}
                    </option>
                );
            })}
        </select>
    );
}
