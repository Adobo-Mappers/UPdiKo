import './AccountInfoSection.css';
import homeIcon from '../assets/images/icon/home-icon.png'
import mapIcon from '../assets/images/icon/map-pin-icon.png'
import accountIcon from '../assets/images/icon/user-icon.png'
import { getCurrentUser } from '../services/firebase/firebase.js';
import { useRef, useState } from "react";

function AccountInfoSection({ setAppSection }) {
    const user = getCurrentUser();

    return (
        <div className="AccountInfoSection">

            {/* HEADER */}
            <main>
                <figure className="mascot"></figure>
                <div className="mascot-dialogue">
                    ACCOUNT SETTINGS
                </div>
            </main>

            {
                getCurrentUser() ? (
                    <div className="user-info-container">
                        <h2 className="info-title">User Information</h2>
                        <div className="user-info">
                            <p className="info-label">Name:</p>
                            <p className="info-content">{user.displayName}</p>
                        </div>
                        <div className="user-info">
                            <p className="info-label">Email:</p>
                            <p className="info-content">{user.email}</p>
                        </div>
                    </div>
                ) : <></>
            }
            
            {/* NAV BAR */}
            <footer>
                <nav className="nav-bar">
                    <div className="navigations" onClick={() => setAppSection("HOME")}>
                        <img src={homeIcon}></img>
                        <p>Home</p>
                    </div>
                    <div className="navigations" onClick={() => setAppSection("MAP")}>
                        <img src={mapIcon}></img>
                        <p>Map</p>
                    </div>        
                    <div className="navigations active-section" onClick={() => setAppSection("ACCOUNT")}>
                        <img src={accountIcon} id='account'></img>
                        <p>Account</p>
                    </div>
                </nav>
            </footer>
        </div>
    );
}

export default AccountInfoSection;