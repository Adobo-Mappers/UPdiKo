import "./Heading.css"

export function Heading({children, className=""}) {
    return <p className={`heading ${className}`}>{children}</p>
}
