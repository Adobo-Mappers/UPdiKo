import './CircularButton.css';

export function CircularButton({ toggled, children, className=""}) {
    return (
        <button className={`circular-button ${toggled ? 'toggled' : ''} ${className}`}>
            {children}  s
        </button>
    );
}
