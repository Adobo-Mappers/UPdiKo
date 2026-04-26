import './TabLink.css' 
import Text from "../../typography/Text/Text";

export default function TabLink( {label, active, onClick} ) {
    return (
        <button className={`tab-link ${active ? 'active' : ''}`} onClick={onClick}>
            {label}
        </button>
    )
}