import { useState } from 'react';
import MapSection from './pages/map/MapSection.jsx';
import HomeSection from './pages/home/HomeSection.jsx';
import AccountSection from './pages/account/AccountSection.jsx';
import LoginSection from './pages/auth/LoginSection.jsx';
import RegisterSection from './pages/auth/RegisterSection.jsx';
import AccountInfoSection from './pages/account/AccountInfoSection.jsx';
import AccountUpdateSection from './pages/account/AccountUpdateSection.jsx';
import PersonalPinSection from './pages/map/PersonalPinSection.jsx';
import CassieSection from './pages/cassie/CassieSection.jsx';

function App() {
    const [section, setSection] = useState("HOME");
    
    const [service, setService] = useState(null);

    const [showCasie, setShowCasie] = useState(false);

    const [navigateToLocation, setNavigateToLocation] = useState(null);

    const handleNavigateToLocation = (place) => {
        setService(place);
        setShowCasie(false);
    };

    return (
        <>
            {(() => {
                switch (section) {
                case "HOME":
                    return <HomeSection setAppSection={setSection} setAppService={setService} />;
                case "MAP":
                    return <MapSection 
                        setAppSection={setSection} 
                        service={service} 
                        setAppService={setService} 
                        onOpenCasie={() => setShowCasie(true)}
                    />;
                case "ACCOUNT":
                    return <AccountSection setAppSection={setSection} />;
                case "ACCOUNT-UPDATE": 
                    return <AccountUpdateSection setAppSection={setSection} />;
                case "LOGIN":
                    return <LoginSection setAppSection={setSection} />;
                case "REGISTER":
                    return <RegisterSection setAppSection={setSection} />;
                case "PERSONAL-PIN":
                    return <PersonalPinSection setAppSection={setSection} setAppService={setService} />;
                default:
                    return <HomeSection setAppSection={setSection} setAppService={setService} />;
                }
            })()}
            {showCasie && (
                <CassieSection 
                    currentSection={section} 
                    selectedService={service} 
                    onClose={() => setShowCasie(false)}
                    onNavigateToLocation={handleNavigateToLocation}
                />
            )}
        </>
    );
}

export default App;