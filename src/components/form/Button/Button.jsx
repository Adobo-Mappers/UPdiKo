import './Button.css';

export function Button({ toggled, children, className="", ...rest}) {
    return (
        <button className={`button ${toggled ? 'toggled' : ''} ${className}`} {...rest}>
            {children}
        </button>
    );
}
