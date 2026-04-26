import './App.css';

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Caption from './components/typography/Caption/Caption';

import Icon from './components/ui/Icon/Icon';
import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import ServicesInfoPage from './pages/services/ServiceInfoPage/ServiceInfoPage';
import MapPage from './pages/map/MapPage/MapPage';
import AccountPage from './pages/account/AccountPage/AccountPage';

import servicesLinkIcon from './assets/images/icon/services-nav-icon.png';
import mapLinkIcon from './assets/images/icon/map-nav-icon.png';
import accountLinkIcon from './assets/images/icon/account-nav-icon.png';
import Emphasis from './components/typography/Emphasis/Emphasis';

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
                        <Icon src={servicesLinkIcon} size="large"/>
                        <Caption><Emphasis type='white'>Services</Emphasis></Caption>
                    </NavLink>
                    <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <Icon src={mapLinkIcon} size="large"/>
                        <Caption><Emphasis type='white'>Map</Emphasis></Caption>
                    </NavLink>
                    <NavLink to="/account" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        <Icon src={accountLinkIcon} size="large"/>
                        <Caption><Emphasis type='white'>Account</Emphasis></Caption>
                    </NavLink>
                </nav>
            </BrowserRouter>
        </div>
    );
}

