/**
 * In the src folder, files are imported. No fetching for you to do as Webpack does it all for you,
 * but this means that to get image files, json files, css files, and such, we import them.
 * 
 */ 
import './StartSection.css'

import mascot from './../../images/logo/logo.png'
import homeIcon from './../../images/icon/home-icon.png'
import mapIcon from './../../images/icon/map-pin-icon.png'
import accountIcon from './../../images/icon/user-icon.png'
import searchIcon from './../../images/icon/search-icon.png'

import serviceTagsData from '../../json/tags.json';
import campusServicesData from '../../json/campus-facilities.json';
import communityServicesData from '../../json/miagao-facilities.json';

import { use, useState } from 'react';
import { onAuthStateChangedListener, getCurrentUser } from '../../firebase/firebase.js'

function StartSection({setAppSection, setAppService}) {
    /* For searching services through the search bar or filtering displayed services with tags */
    const [activeCategory, setCategory] = useState("All")          
    const [searchQuery, setSearchQuery] = useState("") 
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value.toLowerCase().trim()); 
    }

    /* For user choosing a service */
    function chooseService(service) {
        setAppService(service); 
        setAppSection("MAP")
    }

    /* Services Data */
    const tags = serviceTagsData.reduce((accumulator, curr) => [...accumulator , ...curr.tags], ["All"])
    const services = [...campusServicesData, ...communityServicesData]
    const filteredServices = services.filter(service => {
        const nameLower = service.name.toLowerCase();    
        const matchesSearch = nameLower.includes(searchQuery);
        const matchesCategory = activeCategory === "All" || service.tags.includes(activeCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="StartSection">
            <header> 
                <figure className='logo'>
                    <img src={mascot} alt='Logo Image'></img>
                    <figcaption className="logo-name">
                        UPdi Ko!
                    </figcaption>
                    <figcaption className='subheading'>Buligan ta 'ka pangita!</figcaption>
                </figure>
            </header>   
            
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
                {
                    tags.map((tag, index) => (
                        <div 
                            key={index} 
                            className= { (tag == activeCategory) ? "category-btn active-category btn" : "category-btn btn" } 
                            onClick= { () => setCategory(tag) } 
                        >
                            {tag}
                        </div>
                    ))
                }
                </div>
                <div className='service-list' key={activeCategory + searchQuery}>
                {
                    filteredServices.map((service, index) => (
                        <div key={index} className='service-btn btn' onClick = {() => chooseService(service)} >
                            <img src={mapIcon}></img>
                            <div>
                                <h2 className='title'>{service.name}</h2>
                                <h3 className='tag'>{service.tags.join(", ")}</h3>
                            </div>
                        </div>
                    ))
                }
                </div>
            </section>


            <footer>
                <nav>
                    <ul>
                        <li className='navigation active btn' onClick={ () => setAppSection("HOME") }>
                            <img className='icon' src={homeIcon}></img>
                            <p className='label'>Service</p>    
                        </li>
                        <li className='navigation btn' onClick={ () => setAppSection("MAP") }>
                            <img className='icon' src={mapIcon}></img>
                            <p className='label'>Map</p>    
                        </li>
                        <li className='navigation btn' onClick={ () => getCurrentUser() ? setAppSection("ACCOUNT") : setAppSection("LOGIN") }>
                            <img className='icon' src={accountIcon}></img>
                            <p className='label'>Account</p>    
                        </li>
                    </ul>
                </nav>
            </footer>
        </div>
    )
}

export default StartSection;