import './AccountSection.css';

import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import bookmarkIcon from '../../assets/images/icon/saved-icon.png'
import logoutIcon from '../../assets/images/icon/logout-icon.png'

import { logOut, getCurrentUser } from '../../services/supabase.js';
import { useState, useEffect } from "react";

function AccountSection({ setAppSection }) {
    // getCurrentUser() is now async — load user into state on mount
    const [user, setUser] = useState(null);

    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    async function userLogOut() {
        await logOut();
        setAppSection("LOGIN");
    }

    // Don't render until user is resolved
    if (!user) return null;

    return (
        <div className="AccountSection">
            <header>
                <div className='profile'>
                    <figure className='logo'><img src={mascot}></img></figure>
                    <div className='information'>
                        {/* Supabase stores display name in user_metadata */}
                        <div className='name'>{user.user_metadata?.display_name ?? user.email}</div>
                        <div className='email'>{user.email}</div>
                    </div>
                </div>
                <div className='buttons'>
                    <figure className='logout-icon btn'><img src={logoutIcon} onClick={userLogOut}></img></figure>
                </div>
            </header>

            <section className='dashboard'>
                <hgroup>
                    <h1>Dashboard</h1>
                    <h2>Good day! What do you want to today?</h2>
                </hgroup>
                <div className='dashboard-options'>
                    <div className='option-btn btn' onClick={() => setAppSection("ACCOUNT-UPDATE")}>
                        <img src={bookmarkIcon}></img>
                        <div>
                            <h2 className='title'>Update Account</h2>
                            <h3 className='subtitle'>Change your account details</h3>
                        </div>
                    </div>
                    <div className='option-btn btn' onClick={() => setAppSection("PERSONAL-PIN")}>
                        <img src={mapIcon}></img>
                        <div>
                            <h2 className='title'>Your Personal Pins</h2>
                            <h3 className='subtitle'>Manage your created pins</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* NAV BAR */}
            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={() => setAppSection("HOME")}>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation btn'>
                            <img className='icon' src={mapIcon} onClick={() => setAppSection("MAP")}></img>
                            <p className='label'>Map</p>
                        </li>
                        <li className='navigation active btn' onClick={() => setAppSection("ACCOUNT")}>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p>
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

export default AccountSection;