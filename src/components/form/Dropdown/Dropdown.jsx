import './Dropdown.css';

export function Dropdown({value="", options=[], className="", onChange}) {
    return (
        <div className={`dropdown ${className}`}>
            <select value={value} onChange={(e) => onChange && onChange(e.target.value)}>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}
