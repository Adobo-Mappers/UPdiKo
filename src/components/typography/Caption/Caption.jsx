import "./Caption.css"
export function Caption({ children, className = "", ...props }) {
    return <p className={`caption ${className}`} {...props}>{children}</p>
}
