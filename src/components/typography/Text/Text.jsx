import "./Text.css"

export function Text({children, className="", ...rest}) {
    return <p className={`text ${className}`} {...rest}>{children}</p>
}
