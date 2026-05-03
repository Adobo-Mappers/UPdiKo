import './PasswordField.css';
import { useState } from 'react';
import { Icon } from '../../ui';

export function PasswordField({ placeholder="", className="", ...rest }) {
    const [showPassword, setShowPassword] = useState(false);    

    return (
        <div className='password-field'>
            <Icon className='password-icon' name="password" size="medium"/>
            <input type={showPassword ? 'text' : 'password'} placeholder={placeholder} className={`${className}`} {...rest}/>
            <Icon className='show-password-icon' name={`${showPassword ? 'hide' : 'eye'}`} size="medium" onClick={() => setShowPassword(!showPassword)}/>
        </div>
    );
}
