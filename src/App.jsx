import { useState } from 'react';
import MapSection from './pages/MapSection.jsx';
import StartSection from './pages/StartSection.jsx';
import AccountSection from './pages/AccountSection.jsx';
import LoginSection from './pages/LoginSection.jsx';
import RegisterSection from './pages/RegisterSection.jsx';
import AccountInfoSection from './pages/AccountInfoSection.jsx';
import AccountUpdateSection from './pages/AccountUpdateSection.jsx';
import PersonalPinSection from './pages/PersonalPinSection.jsx';

function App() {
    /** 
     *  This hook is a global state that keeps track of the current page the user is in.  
     *  The pages are: HOME, MAP, ACCOUNT, LOGIN, & REGISTER  
     */
    const [section, setSection] = useState("HOME");
    
    
    /**
     * This hook is a global state that keeps track of the current service the user chose/searched 
     * from HOME or MAP
     * 
     * The service state will be kept until the user exits MAP.  
     * The service will be displayed in MAP.
     */
    const [service, setService] = useState(null); 

    /**
     * These are the routes or logic for the currently renderd page.
     */
    switch (section) {
    case "HOME":
        return <StartSection setAppSection={setSection} setAppService={setService} />;
    case "MAP":
        return <MapSection setAppSection={setSection} service={service} setAppService={setService} />;
    case "ACCOUNT":
        return <AccountSection setAppSection={setSection} />;
    case "ACCOUNT-UPDATE": 
        return <AccountUpdateSection setAppSection={setSection} />;
    case "LOGIN":
        return <LoginSection setAppSection={setSection} />;
    case "REGISTER":
        return <RegisterSection setAppSection={setSection} />;
    case "PERSONAL-PIN":
        return <PersonalPinSection setAppSection={setSection} />;
    default:
        return <StartSection setAppSection={setSection} setAppService={setService} />; // Fallback
    }
}

export default App;