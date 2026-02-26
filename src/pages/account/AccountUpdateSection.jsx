import "./AccountUpdateSection.css";
import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import showPassIcon from '../../assets/images/icon/view-pass-icon.png'
import hidePassIcon from '../../assets/images/icon/hide-pass-icon.png'
import bookmarkIcon from '../../assets/images/icon/saved-icon.png'
import logoutIcon from '../../assets/images/icon/logout-icon.png'
import backIcon from '../../assets/images/icon/back-icon-2.png'
import closeIcon from '../../assets/images/icon/close-icon.png'

import {
  getCurrentUser,
  updateUserProfile,
  updateUserPassword,
  saveUserDataToDB,
  logOut
} from "../../services/firebase/firebase.js";

import { useEffect, useState } from "react";
function AccountUpdateSection({ setAppSection, redirect, setAppRedirectBody}) {
  /* See Password */
  const [isVisible, setVisible] = useState(false);
  function togglePasswordVisibility() {    
      setVisible(!isVisible);
  }

  /* Error Messages */
  const [errorMessage, setErrorMessage] = useState('');   
  const mapFirebaseError = (error) => {
      switch (error.code) {
          case 'auth/email-already-in-use':
              return "This email address is already registered. Please log in.";
          case 'auth/invalid-email':
              return "The email address is not in a valid format.";
          case 'auth/weak-password':
              return "The password must be at least 6 characters long.";
          default:
              return "User updates failed. Please check your inputs and try again.";
      }
  };

  async function userLogOut() {
      await logOut();
      setAppSection("LOGIN");  
  }
  
  const user = getCurrentUser();

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  if (!user) return null;

  const handleUpdate = async () => {
    try {
      if (!displayName) {
          setErrorMessage("Please fill in all the required fields.");
          return;
      }
      
      // Update display name and email
      await updateUserProfile({
        displayName: displayName || user.displayName,
      });

      // If password is being changed, ask for current password
      if (newPassword.trim()) {
        setShowPasswordConfirm(true);
        return;
      }

      await finalizeDBUpdate();
      setAppSection("ACCOUNT")
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
    }
  };

  const finalizeDBUpdate = async () => {
    await saveUserDataToDB(user.uid, {
      name: displayName || user.displayName,
    });
  };

  const handlePasswordConfirm = async () => {
    try {
      await updateUserPassword(newPassword.trim(), currentPassword);

      await finalizeDBUpdate();

      setNewPassword("");
      setCurrentPassword("");
      setShowPasswordConfirm(false);
      setAppSection("ACCOUNT")
    } catch (error) {
      setErrorMessage(mapFirebaseError(error));
    }
  };

  return (
    <div className="AccountUpdateSection">
          <header>
            <div className='profile'>
                <figure className='logo'><img src={mascot}></img></figure>
                <div className='information'>
                    <div className='name'>{user.displayName}</div>
                    <div className='email'>{user.email}</div>
                </div>
            </div>
            <div className='buttons'>
                <figure className='logout-icon btn'><img src={logoutIcon} onClick={ userLogOut }></img></figure>
            </div>
        </header>
    
        <section className="section-name"> 
           <hgroup>
                <h1>Update Account</h1>
            </hgroup>
            <figure className="back-button btn" onClick={ () => setAppSection("ACCOUNT")} >
              <img src={backIcon}></img>  
            </figure>        
        </section> 

        <section className='form-section'>
            <div className="register-container">
                <input 
                    type="text" 
                    className='FName' 
                    placeholder="First Name" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                ></input>
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
                        onChange={(e) => setNewPassword(e.target.value)}
                    /> 
                </div>
                
                {errorMessage && (
                    <p className="error-message">{errorMessage}</p>
                )}

                <button className="update-btn btn" onClick={handleUpdate}>Update</button>
            </div>
        </section>

        {/* PASSWORD CONFIRM */}
        {showPasswordConfirm && (
            <div className="modal">
              <div className="dialogue">
                <figure className="close-btn btn" onClick={() => setShowPasswordConfirm(false)}><img src={closeIcon}></img></figure>
                <p>Enter current password to confirm</p>
                <input
                  className="info-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button className="update-btn btn" onClick={handlePasswordConfirm}>
                  Confirm
                </button>
              </div>
            </div>
        )}

      {/* NAV BAR */}
      <footer>
        <nav>
            <ul>
                <li className='navigation btn' onClick={ () => { setAppSection("HOME")} }>
                    <img className='icon' src={homeIcon}></img>
                    <p className='label'>Service</p>    
                </li>
                <li className='navigation active btn' onClick={ () => setAppSection("MAP") }>
                    <img className='icon' src={mapIcon}></img>
                    <p className='label'>Map</p>    
                </li>
                <li className='navigation btn' onClick={ () => getCurrentUser() ? (setAppSection("ACCOUNT")) : (setAppSection("LOGIN"))}>
                    <img className='icon' src={accountIcon}></img>
                    <p className='label'>Account</p>    
                </li>
            </ul>
        </nav>
      </footer>
    </div>
  );
}

export default AccountUpdateSection;