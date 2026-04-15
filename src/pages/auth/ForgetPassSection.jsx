import './ForgetPassSection.css';
import { sendPasswordReset } from "../../services/supabase.js";

import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import showPassIcon from '../../assets/images/icon/view-pass-icon.png'
import hidePassIcon from '../../assets/images/icon/hide-pass-icon.png'

import { useState } from "react" 

function ForgetPassSection({ setAppSection }) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); 
    const [successMessage, setSuccessMessage] = useState('');

    const mapSupabaseError = (error) => {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("rate limit")) {
            return "Too many requests. Please wait a moment before trying again.";
        }
        if (msg.includes("invalid email")) {
            return "The email address is not in a valid format.";
        }
        return "Could not send reset email. Please try again.";
    };

    
    async function handleForgetPass() {
        setErrorMessage('');
        setSuccessMessage('');

        const email = document.querySelector('.email').value.trim();

        if (!email) {
            setErrorMessage("Please enter an email address");
            return;
        }

        try {
            setIsLoading(true);
            await sendPasswordReset(email);
            setSuccessMessage("Password reset link sent! Please check your email inbox.");
        } catch (error) {
            console.error("Error resetting password:", error);
            setErrorMessage(mapSupabaseError(error));
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="ForgetPassSection">
            <header> 
                <figure className='logo'>
                    <img src={mascot} alt='Logo Image'></img>
                    <figcaption className="logo-name">
                        Reset Password
                    </figcaption>
                </figure>
            </header> 

            <section className='form-section'>
                <div className="forget-pass-container">
                    <p className="instruction-text">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                    
                    <input type="email" className='email' placeholder="Email Address"></input>
                    
                    {errorMessage && (
                        <p className="error-message">{errorMessage}</p>
                    )}

                    {successMessage && (
                        <p className="success-message">{successMessage}</p>
                    )}

                    {/* style={{color: 'green', fontSize: '0.9rem'}} */}

                    <button 
                        className="forget-pass-button" onClick={handleForgetPass} disabled={isLoading}
                    >
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>
                </div>
            </section>

            <section className='forget-pass-description-section'>
                Remember your password? <br></br>
                <span className='to-forget-pass-ref' onClick={() => setAppSection("LOGIN")}>
                    Back to Login
                </span> 
            </section>

            {/* NAV BAR */}
            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={() => setAppSection("HOME")}>
                            <img className='icon' src={homeIcon} alt="home"></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation btn' onClick={() => setAppSection("MAP")}>
                            <img className='icon' src={mapIcon} alt="map"></img>
                            <p className='label'>Map</p> 
                        </li>
                        <li className='navigation active btn' onClick={() => setAppSection("ACCOUNT")}>
                            <img className='icon' src={accountIcon} alt="account"></img>
                            <p className='label'>Account</p> 
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

export default ForgetPassSection;