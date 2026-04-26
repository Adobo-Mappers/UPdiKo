import './App.css';

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Caption from './components/typography/Caption/Caption';

import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import ServicesInfoPage from './pages/services/ServiceInfoPage/ServiceInfoPage';
import MapPage from './pages/map/MapPage/MapPage';
import AccountPage from './pages/account/AccountPage/AccountPage';

import servicesLinkIcon from './assets/images/icon/services-nav-icon.png';
import mapLinkIcon from './assets/images/icon/map-nav-icon.png';
import accountinkIcon from './assets/images/icon/account-nav-icon.png';


export default function App() {
    return (
        <div className="app">            
            <BrowserRouter>
                <Routes>
                    {/* default routing (routes to services page) */}
                    <Route path='/' element={<ServicesPage/>}/>

                    {/* service page routing*/}
                    <Route path='/services' element={<ServicesPage/>}/>
                    <Route path='/services/info' element={<ServicesInfoPage/>}/>

                    {/* map page routing*/}
                    <Route path='/map' element={<MapPage/>}/>
                    
                    {/* account page routing*/}
                    <Route path='/account' element={<AccountPage/>}/>
                </Routes>

                <nav className='navbar'>
                    <NavLink to="/services" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <img src={servicesLinkIcon}></img>
                        <Caption>Services</Caption>
                    </NavLink>
                    <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <img src={mapLinkIcon}></img>
                        <Caption>Map</Caption>
                    </NavLink>
                    <NavLink to="/account" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <img src={accountinkIcon}></img>
                        <Caption>Account</Caption>
                    </NavLink>
                </nav>
            </BrowserRouter>
        </div>
    );
}

