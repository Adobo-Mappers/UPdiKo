import './App.css';

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Footer } from './components/ui';
import { supabase, getCurrentUser } from './services/supabase';

// B1 pages (base)
import ServicesPage from './pages/services/ServicesPage/ServicesPage';
import ServiceCategoryPage from './pages/services/ServiceCategoryPage/ServicesCategoryPage.jsx';
import ServiceInfoPage from './pages/services/ServiceInfoPage/ServiceInfoPage';
import MapPage from './pages/map/MapPage/MapPage';
import LoginPage from './pages/account/LoginPage/LoginPage';
import RegisterPage from './pages/account/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/account/ForgotPasswordPage/ForgotPasswordPage';
import AccountPage from './pages/account/AccountPage/AccountPage';
import LabPage from './pages/lab/Lab';

// B2 new pages
import AccountUpdatePage from './pages/account/AccountUpdatePage/AccountUpdatePage';
import PersonalPinsPage from './pages/account/PersonalPinsPage/PersonalPinsPage';

const queryClient = new QueryClient();

export default function App() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <div className="app">
                <BrowserRouter>
                    <Routes>
                        {/* Default → services */}
                        <Route path='/' element={<Navigate to='/service/' />} />

                        {/* Services */}
                        <Route path='/service/' element={<ServicesPage />} />
                        <Route path='/service/:category' element={<ServiceCategoryPage/>} />
                        <Route path='/service/:category/:id' element={<ServiceInfoPage/>} />

                        {/* Map */}
                        <Route path='/map/' element={<MapPage />} />
                        <Route path='/map/:id' element={<MapPage />} />

                        {/* Account */}
                        <Route path='/account' element={user ? <AccountPage /> : <Navigate to='/account/login' />} />
                        <Route path='/account/login' element={<LoginPage />} />
                        <Route path='/account/register' element={<RegisterPage />} />
                        <Route path='/account/forgot-password' element={<ForgotPasswordPage />} />

                        {/* B2 new account pages */}
                        <Route path='/account/update' element={<AccountUpdatePage />} />
                        <Route path='/account/pins' element={<PersonalPinsPage />} />

                        {/* Dev */}
                        <Route path='/lab' element={<LabPage />} />

                        <Route path='*' element={<Navigate to='/service/' />} />
                    </Routes>
                    <Footer />
                </BrowserRouter>
            </div>
        </QueryClientProvider>
    );
}
