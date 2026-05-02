import { useState } from 'react';
import './Tab.css';


// Note: for util classes, check index.css for the list :>
export function Tab({ value = "", options = [], activeUtilClass="fw-bold", inactiveUtilClass="", className="" }) {
    const [activeOption, setActiveOption] = useState(value);   

    return (
        <div className={`tab ${className}`}>
        {
             options.map(element => (
                <div
                    key={element}
                    className={`tab-link ${ (element === activeOption) ? `active ${activeUtilClass}` : `inactive ${inactiveUtilClass}`}`}
                    onClick={() => setActiveOption(element)}
                >
                {element}
                </div>
            ))
        }
        </div>
    )
}