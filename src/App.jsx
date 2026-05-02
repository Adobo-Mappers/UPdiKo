import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Footer } from './components/ui';
import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import ServiceInfoPage from './pages/services/ServiceInfoPage/ServiceInfoPage';
import MapPage from './pages/map/MapPage/MapPage';
import AccountPage from './pages/account/AccountPage/AccountPage';
import LoginPage from './pages/account/LoginPage/LoginPage';

export default function App() {
    return (
        <div className="app">
            <BrowserRouter>
                <Routes>
                    {/* default routing (routes to services page) */}
                    <Route path='/' element={<ServicesPage/>}/>
                    
                    <Route path='/service/' element={<ServicesPage/>}/>
                    
                    <Route path='/service/info' element={<ServiceInfoPage/>}/>

                    {/* map page routing*/}
                    <Route path='/map' element={<MapPage/>}/>
                    
                    {/* account page routing*/}
                    <Route path='/account' element={<AccountPage/>}/>
                    <Route path='/account/login' element={<LoginPage/>}/>
                </Routes>                
                <Footer/>
            </BrowserRouter>
        </div>
    );
}

