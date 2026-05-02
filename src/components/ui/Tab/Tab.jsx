import { useState } from 'react';
import './Tab.css';


// Note: for util classes, check index.css for the list :>
export function Tab({ value = "", options = [], activeUtilClass="fw-bold", inactiveUtilClass="", className="", onChange }) {
    return (
    <div className='tab'>
        {
            options.map((option) => (
                <div 
                    key={option}    
                    className={`tab-link ${(value == option) ? activeUtilClass : inactiveUtilClass}`}
                    onClick={() => onChange && onChange(option)}
                >
                    {option}
                </div>
            ))
        }                
    </div>
    );

}