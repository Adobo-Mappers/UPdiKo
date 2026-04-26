export default function DropdownOption({ value, label}) {
    return (
        <option value={value}>
            {label}
        </option>
    );
}