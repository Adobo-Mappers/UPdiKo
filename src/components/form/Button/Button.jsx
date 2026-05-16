import './Button.css';
import { Link } from 'react-router-dom';

export function Button({ children, toggled=false, className="", href="", width="fit-content", ...rest}) {
    return (
        (href) ? (
            <Link to={href}>
                <button className={`button ${className} ${(toggled ? "toggled": "")}`} style={{"width": width}} {...rest}>
                    {children}
                </button>
            </Link>
        ) : (
            <button className={`button ${className}  ${(toggled ? "toggled": "")}`} style={{"width": width}} {...rest}>
                {children}
            </button>
        )
    
    );
}
