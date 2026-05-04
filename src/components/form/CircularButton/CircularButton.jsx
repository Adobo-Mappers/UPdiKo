import './CircularButton.css';

export function CircularButton({ children, className=""}) {
    return (
        <button className={`circular-button ${className}`} style={{"width": width}}>
            {children}
        </button>
    );
}
