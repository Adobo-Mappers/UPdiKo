import './Tab.css';

export function Tab({ options=[], value, onChange, className="", defaultClassName="", activeClassName=""}) {
    return (
        <div className={`tab ${className}`}>  
            {options.map((option, index) => (
                <button 
                    key={index}
                    className={`tab-link ${(value === option) ? activeClassName : defaultClassName}`}
                    onClick={() => onChange && onChange(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}