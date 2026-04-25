import "./Emphasis.css"

export default function Emphasis({weight="regular", type="default", children}) {
    /**
     * Edits color and font weight of typography components
     * 
     * Emphasis property types
     * weight: "regular" | "medium" | "semi-bold" | "bold"
     * type: "muted" | "accent" | "default"
     */
    
    return <em className={`emphasis ${weight} ${type}`}>
        {children}
    </em>
}