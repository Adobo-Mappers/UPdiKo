import './App.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Footer } from './components/ui';
import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import MapPage from './pages/map/MapPage/MapPage';
import AccountPage from './pages/account/AccountPage/AccountPage';

export default function App() {
    return (
        <div className="app">            
            <BrowserRouter>
                <Routes>
                    {/* default routing (routes to services page) */}
                    <Route path='/' element={<ServicesPage/>}/>
                    
                    {/* map page routing*/}
                    <Route path='/map' element={<MapPage/>}/>
                    
                    {/* account page routing*/}
                    <Route path='/account' element={<AccountPage/>}/>
                </Routes>
                
                <Footer/>
            </BrowserRouter>
        </div>
    );
}

