import "./Subtitle.css"

export function Subtitle({children, className="", ...rest}) {
    return <p className={`subtitle ${className}`} {...rest}>{children}</p>
}
