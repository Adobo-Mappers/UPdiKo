import './CircularButton.css';

export function CircularButton({ children, className="", width="40px" , ...rest}) {
    return (
        <button className={`circular-button ${className}`} style={{"width": width}} {...rest}>
            {children}
        </button>
    );
}
