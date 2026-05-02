import "./Text.css"

export function Text({children, className=""}) {
    return <p className={`text ${className}`}>{children}</p>
}
