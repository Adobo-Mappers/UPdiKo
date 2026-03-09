import './RegisterSection.css';
import { signUp, saveUserDataToDB, updateUserProfile } from "../../services/supabase.js";

import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import showPassIcon from '../../assets/images/icon/view-pass-icon.png'
import hidePassIcon from '../../assets/images/icon/hide-pass-icon.png'

import { useState } from "react" 

function RegisterSection({ setAppSection }) {
    const [isVisible, setVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); 

    function togglePasswordVisibility() {    
        setVisible(!isVisible);
    }

    const mapSupabaseError = (error) => {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("user already registered") || msg.includes("already been registered")) {
            return "This email address is already registered. Please log in.";
        }
        if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
            return "The email address is not in a valid format.";
        }
        if (msg.includes("password should be at least") || msg.includes("weak password")) {
            return "The password must be at least 6 characters long.";
        }
        return "Registration failed. Please check your inputs and try again.";
    };

    
    async function handleRegister() {
        setErrorMessage('');

        const email = document.querySelector('.email').value.trim();
        const password = document.querySelector('.password').value.trim();
        const FName = document.querySelector('.FName').value.trim();
        const LName = document.querySelector('.LName').value.trim();
        const name = `${FName} ${LName}`;

        if (!FName || !LName || !email || !password) {
            setErrorMessage("Please fill in all the required fields.");
            return;
        }

        try {
            const newUserCredential = await signUp(email, password);
            
            await updateUserProfile({
              displayName: name
            });
            
            await saveUserDataToDB(newUserCredential.uid, {
              name,
              email
            });


            setAppSection("HOME");
        } catch (error) {
            console.error("Error creating account:", error);
            setErrorMessage(mapSupabaseError(error));
        }
    }
    
    return (
        <div className="RegisterSection">
            <header> 
                <figure className='logo'>
                    <img src={mascot} alt='Logo Image'></img>
                    <figcaption className="logo-name">
                        User Signup
                    </figcaption>
                </figure>
            </header> 

            <section className='form-section'>
                <div className="register-container">
                    <input type="text" className='FName' placeholder="First Name"></input>
                    <input type="text" className='LName' placeholder="Last Name"></input>
                    <input type="text" className='email' placeholder="Email"></input>
                    <div className='password-input-container'> 
                        <img 
                            className='show-pass-btn btn' 
                            src={ isVisible ? hidePassIcon : showPassIcon }
                            onClick={ togglePasswordVisibility }
                        />
                        <input 
                            className='password'
                            type= { isVisible? "text": "password"} 
                            placeholder="Password"
                        /> 
                    </div>
                    
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}

                    <button className="register-button" onClick={handleRegister}>Register</button>
                </div>
            </section>

            <section className='register-description-section'>
                Already have an account? <br></br><span className='to-register-ref' onClick={ () => setAppSection("LOGIN") }>Login to your account</span> 
            </section>

            {/* NAV BAR */}
            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={ () => setAppSection("HOME") }>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation btn'>
                            <img className='icon' src={mapIcon} onClick={ () => setAppSection("MAP") }></img>
                            <p className='label'>Map</p> 
                        </li>
                        <li className='navigation active btn' onClick={ () => setAppSection("ACCOUNT") }>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p> 
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

export default RegisterSection;