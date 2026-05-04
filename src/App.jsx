import './App.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Footer } from './components/ui';
import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import ServiceInfoPage from './pages/services/ServiceInfoPage/ServiceInfoPage';
import MapPage from './pages/map/MapPage/MapPage';
import AccountPage from './pages/account/AccountPage/AccountPage';
import LoginPage from './pages/account/LoginPage/LoginPage';
import RegisterPage from './pages/account/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/account/ForgotPasswordPage/ForgotPasswordPage';

import LabPage from './pages/lab/Lab'

export default function App() {
    return (
        <div className="app">
            <BrowserRouter>
                <Routes>
                    {/* Test Route: <Route path='/' element={<LabPage/>}/> */}

                    {/* default routing (routes to services page) */}
                    <Route path='/' element={<Navigate to='/service/' />} />
                    
                    <Route path='/service/' element={<ServicesPage/>}/>                
                
                    {/* <Route path='/service/info/:id' element={<ServiceInfoPage/>}/> */}

                    {/* map page routing*/}
                    {/* <Route path='/map' element={<MapPage/>}/> */}
                    
                    {/* account page routing*/}
                    {/* <Route path='/account' element={<AccountPage/>}/> */}
                    {/* <Route path='/account/login' element={<LoginPage/>}/> */}
                    {/* <Route path='/account/register' element={<RegisterPage/>}/> */}
                    {/* <Route path='/account/forgot-password' element={<ForgotPasswordPage/>}/> */}
                </Routes>                
                <Footer/>
            </BrowserRouter>
        </div>
    );
}

