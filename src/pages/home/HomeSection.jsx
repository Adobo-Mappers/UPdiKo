import './HomeSection.css'

import mascot from '../../assets/images/logo/logo.png'
import homeIcon from '../../assets/images/icon/home-icon.png'
import mapIcon from '../../assets/images/icon/map-pin-icon.png'
import accountIcon from '../../assets/images/icon/user-icon.png'
import searchIcon from '../../assets/images/icon/search-icon.png'

// Removed: serviceTagsData, campusServicesData, communityServicesData JSON imports
// All data now fetched from Supabase static_locations table

import { useState, useEffect } from 'react';
import { getCurrentUser, supabase } from '../../services/supabase.js'
import CalendarView from '../../components/calendar/Calendar.jsx';
import WeatherView from '../../components/weather/Weather.jsx';

function HomeSection({setAppSection, setAppService}) {
    /* For searching services through the search bar or filtering displayed services with tags */
    const [activeCategory, setCategory] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value.toLowerCase().trim());
    }

    // getCurrentUser() is now async — load user into state on mount
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then(setUser);
    }, []);

    // Replaces campusServicesData + communityServicesData JSON imports
    const [allServices, setAllServices] = useState([]);
    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase
                .from("static_locations")
                .select("id, name, tags, address, latitude, longitude, opening_hours, contact_info, services, images, additional_info, location_type");
            if (error) {
                console.error("Error fetching services:", error);
                return;
            }
            setAllServices(data);
        };
        fetchServices();
    }, []);

    // Replaces serviceTagsData JSON import — derives unique tags from fetched services
    const tags = ["All", ...new Set(allServices.flatMap(service => service.tags ?? []))];

    /* For user choosing a service */
    function chooseService(service) {
        // Service objects from Supabase already have latitude/longitude — no adapter needed
        setAppService(service);
        setAppSection("MAP");
    }

    /* Filter services */
    const filteredServices = allServices.filter(service => {
        const nameLower = service.name.toLowerCase();
        const matchesSearch = nameLower.includes(searchQuery);
        const matchesCategory = activeCategory === "All" || (service.tags ?? []).includes(activeCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="HomeSection">
            <header>
                <figure className='logo'>
                    <img src={mascot} alt='Logo Image'></img>
                    <figcaption className="logo-name">
                        UPdi Ko!
                    </figcaption>
                    <figcaption className='subheading'>Buligan ta 'ka pangita!</figcaption>
                </figure>
            </header>

            {/* <WeatherView /> // Weather widget temporarily for testing */}

            <section className='search-section'>
                <img src={searchIcon} className="icon"></img>
                <input
                    className='search-bar'
                    placeholder='Search for Services'
                    onChange={handleSearchChange}
                />
            </section>

            <section className='service-section'>
                <h1>Services</h1>
                <div className='categories'>
                    {tags.map((tag, index) => (
                        <div
                            key={index}
                            className={(tag == activeCategory) ? "category-btn active-category btn" : "category-btn btn"}
                            onClick={() => setCategory(tag)}
                        >
                            {tag}
                        </div>
                    ))}
                </div>
                <div className='service-list' key={activeCategory + searchQuery}>
                    {filteredServices.map((service) => (
                        // Use Supabase row id as key instead of array index
                        <div key={service.id} className='service-btn btn' onClick={() => chooseService(service)}>
                            <img src={mapIcon}></img>
                            <div>
                                <h2 className='title'>{service.name}</h2>
                                <h3 className='tag'>{(service.tags ?? []).join(", ")}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* <CalendarView /> // Calendar temporarily for testing */}

            <footer>
                <nav>
                    <ul>
                        <li className='navigation active btn' onClick={() => setAppSection("HOME")}>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>
                        </li>
                        <li className='navigation btn' onClick={() => setAppSection("MAP")}>
                            <img className='icon' src={mapIcon}></img>
                            <p className='label'>Map</p>
                        </li>
                        {/* getCurrentUser() is async — use already-resolved user state */}
                        <li className='navigation btn' onClick={() => setAppSection(user ? "ACCOUNT" : "LOGIN")}>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p>
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    )
}

export default HomeSection;