import './Dropdown.css';

export default function Dropdown({value, onChange, children }) {
    return (
        <div className='dropdown'>
            <select value={value} onChange={onChange}>
                {children}
            </select>
        </div>
    );
}
