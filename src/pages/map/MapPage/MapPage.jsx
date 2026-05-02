import './MapPage.css';
import { useState } from 'react';
import { Button, CircularButton, InputField, Dropdown } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, Tab } from './../../../components/ui/';
import Yu from './../../../assets/images/profile/profile.jpg';


export default function MapPage() {
    const SERVICE_CATEGORIES = ["All", "Restaurant", "Cafe", "Hospital", "Pharmacy", "Grocery", "Salon", "Spa", "Gym"];
    const FILTER_OPTIONS = ["Sort By Nearest", "Sort By Rating", "Open Now"];

    const [activeTab, setActiveTab] = useState(SERVICE_CATEGORIES[0]);

    return (
        <div className="map-page">
            <header className='flex items-center gap-medium px-large py-medium'>
                <InputField className='py-medium border-roundify' icon="search" placeholder="Search for services..."/>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header>
            <Tab className='px-large'
                value={activeTab}
                options={SERVICE_CATEGORIES} 
                onChange={setActiveTab} 
                activeClassName='fw-bold'
            />  
            <section className='map-utils'>
                <CircularButton className='border-circlify'>
                    <Icon name='compass' size='large'/>    
                </CircularButton>
            </section>
        </div>
    );
}