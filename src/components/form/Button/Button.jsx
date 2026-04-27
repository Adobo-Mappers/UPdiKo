import './Button.css';

export function Button({ toggled, children, className=""}) {
    return (
        <button className={`button ${toggled ? 'toggled' : ''} ${className}`}>
            {children}
        </button>
    );
}
