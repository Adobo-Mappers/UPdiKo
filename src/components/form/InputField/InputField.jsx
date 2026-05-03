import './InputField.css';
import { Icon } from './../../ui/';

export function InputField({ icon="", placeholder="", className="", value="", onChange, ...rest }) {
    return (
        <div className={`input-field`}>
            {icon && <Icon name={icon} size="medium" className="input-icon"/>}
            <input
                type='text'
                placeholder={placeholder}
                className={`${className}`}
                value={value}
                onChange={onChange}
                {...rest}
            />
        </div>
    );
}

