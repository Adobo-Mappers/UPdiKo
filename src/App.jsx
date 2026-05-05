import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeSection from './pages/home/HomeSection.jsx';
import MapSection from './pages/map/MapSection.jsx';
import AccountSection from './pages/account/AccountSection.jsx';
import LoginSection from './pages/auth/LoginSection.jsx';
import RegisterSection from './pages/auth/RegisterSection.jsx';
import ForgetPassSection from './pages/auth/ForgetPassSection.jsx';
import AccountUpdateSection from './pages/account/AccountUpdateSection.jsx';
import PersonalPinSection from './pages/map/PersonalPinSection.jsx';

const queryClient = new QueryClient();

const SECTION_PATHS = {
  HOME: '/',
  MAP: '/map',
  ACCOUNT: '/account',
  'ACCOUNT-UPDATE': '/account/update',
  LOGIN: '/login',
  REGISTER: '/register',
  'FORGET-PASS': '/forgot-password',
  'PERSONAL-PIN': '/account/pins',
};

/**
 * Preserves the legacy `setAppSection` contract while routing through React Router.
 *
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @returns {(section: string) => void}
 */
function createSectionNavigator(navigate) {
  return (section) => {
    navigate(SECTION_PATHS[section] || '/');
  };
}

function AppRoutes() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const navigateToSection = createSectionNavigator(navigate);

  /**
   * Navigates to the map while preserving the chosen location in app state.
   *
   * @param {object | null} service
   */
  const openMapWithService = (service) => {
    setSelectedService(service);
    navigate('/map');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomeSection setAppSection={navigateToSection} setAppService={openMapWithService} />
        }
      />
      <Route
        path="/map"
        element={
          <MapSection
            setAppSection={navigateToSection}
            service={selectedService}
            setAppService={setSelectedService}
          />
        }
      />
      <Route
        path="/account"
        element={<AccountSection setAppSection={navigateToSection} />}
      />
      <Route
        path="/account/update"
        element={<AccountUpdateSection setAppSection={navigateToSection} />}
      />
      <Route path="/login" element={<LoginSection setAppSection={navigateToSection} />} />
      <Route
        path="/register"
        element={<RegisterSection setAppSection={navigateToSection} />}
      />
      <Route
        path="/forgot-password"
        element={<ForgetPassSection setAppSection={navigateToSection} />}
      />
      <Route
        path="/account/pins"
        element={
          <PersonalPinSection
            setAppSection={navigateToSection}
            setAppService={setSelectedService}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
