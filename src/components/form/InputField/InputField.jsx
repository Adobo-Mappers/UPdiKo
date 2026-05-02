import './InputField.css';
import { Icon } from './../../ui/';

export function InputField({ icon="", placeholder="", className="" }) {
    return (
        <div className={`input-field`}>
            {icon && <Icon name={icon} size="medium" className="input-icon"/>}
            <input type='text' placeholder={placeholder} className={className}/>
        </div>
    );
}
