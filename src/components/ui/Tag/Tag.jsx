import './Tag.css';
export function Tag({ children, className }) {
    return (
        <div className={`tag ${className}`}>
            {children}
        </div>
    );
}