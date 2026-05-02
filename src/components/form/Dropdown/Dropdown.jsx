import './Dropdown.css';

export function Dropdown({ options=[], value, onChange, className=""}) {
    return (
        <select className={`dropdown ${className}`} value={value} onChange={() => onChange(event.target.value)}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    )
} 