import "./Title.css"

export function Title({children, className=""}) {
    return <p className={`title ${className}`}>{children}</p>
}
