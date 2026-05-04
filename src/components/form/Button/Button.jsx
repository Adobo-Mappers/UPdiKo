import './Button.css';

export function Button({ children, className="", width="fit-content", ...rest}) {
    return (
        <button className={`button ${className}`} style={{"width": width}} {...rest}>
            {children}
        </button>
    );
}
