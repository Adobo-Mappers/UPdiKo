import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicesPage';
import ServicesInfoPage from './pages/services/ServiceInfoPage';
import MapPage from './pages/map/MapPage';
import AccountPage from './pages/account/AccountPage';

export default function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/services">Services</Link>
                <Link to="/map">Map</Link>
                <Link to="/account">Account</Link>
            </nav>
 
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
        </BrowserRouter>
    );
}

