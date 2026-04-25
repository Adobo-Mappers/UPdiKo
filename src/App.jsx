import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ServicesPage from './pages/services/ServicePage';
import MapPage from './pages/map/MapPage';
import AccountPage from './pages/account/AccountPage';

export default function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Services</Link>
                <Link to="/map">Map</Link>
                <Link to="/account">Account</Link>
            </nav>
 
            <Routes>
                <Route path='/' element={<ServicesPage/>}/>
                <Route path='/map' element={<MapPage/>}/>
                <Route path='/account' element={<AccountPage/>}/>
            </Routes>
        </BrowserRouter>
    );
}

