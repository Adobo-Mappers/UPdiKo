import "./Caption.css"
export function Caption({children, className=""}) {
    return <p className={`caption ${className}`}>{children}</p>
}