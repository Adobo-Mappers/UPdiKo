import './PersonalPinSection.css'

import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import bookmarkIcon from '../../assets/images/icon/saved-icon.png'
import logoutIcon from '../../assets/images/icon/logout-icon.png'
import backIcon from '../../assets/images/icon/back-icon-2.png'

import { useState, useEffect } from 'react';

import { getCurrentUser, logOut, getPinnedLocationsFromDB, deletePinnedLocationFromDB } from '../../services/supabase.js';

function PersonalPinSection({setAppSection, setAppService}) {

    const [pinnedLocations, setPinnedLocations] = useState([]);

    // getCurrentUser() is now async — load user into state on mount
    const [user, setUser] = useState(null);

    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // Fetch pins once user is resolved
    useEffect(() => {
        async function fetchPinnedLocations() {
            if (!user) return;
            // Supabase uses user.id, not user.uid
            const locations = await getPinnedLocationsFromDB(user.id);
            setPinnedLocations(locations);
        }
        fetchPinnedLocations();
    }, [user]); // re-runs when user is set

    async function deletePinnedLocation(locationID) {
        if (!user) return;
        // Fix: use the correct parameter names (was incorrectly using location.id)
        await deletePinnedLocationFromDB(user.id, locationID);
        // Refresh the list after deletion
        setPinnedLocations(prev => prev.filter(loc => loc.id !== locationID));
    }

    async function userLogOut() {
        await logOut();
        setAppSection("LOGIN");
    }

    if (!user) return null;

    return (
        <div className="PersonalPinSection">
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

            <section className="section-name">
                <hgroup>
                    <h1>Your Personal Pins</h1>
                </hgroup>
                <figure className="back-button btn" onClick={() => setAppSection("ACCOUNT")}>
                    <img src={backIcon}></img>
                </figure>
            </section>

            <section className='personal-pins'>
                {pinnedLocations.length === 0 ? (
                    <div className='no-service-btn service-btn btn'>
                        <img src={mapIcon}></img>
                        <div>
                            <h2 className='title'>There are currently no created pins.</h2>
                        </div>
                    </div>
                ) : (
                    <div className='service-list'>
                        {pinnedLocations.map((location) => (
                            <div className='service-btn btn' key={location.id}>
                                <img src={mapIcon}></img>
                                <div>
                                    <h2 className='title'>{location.locationName}</h2>
                                    <p className='address'>{location.address}</p>
                                    <p className='desc'>{location.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <footer>
                <nav>
                    <ul>
                        <li className='navigation btn' onClick={() => setAppSection("HOME")}>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation btn' onClick={() => setAppSection("MAP")}>
                            <img className='icon' src={mapIcon}></img>
                            <p className='label'>Map</p>
                        </li>
                        {/* getCurrentUser() is async — use already-resolved user state instead */}
                        <li className='navigation active btn' onClick={() => {
                            setAppService(null);
                            setAppSection(user ? "ACCOUNT" : "LOGIN");
                        }}>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p>
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    );
}

export default PersonalPinSection;