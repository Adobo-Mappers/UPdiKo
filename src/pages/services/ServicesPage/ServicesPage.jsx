import './ServicesPage.css';
import { act, useEffect, useState } from 'react';
import { Button, InputField } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, Tab } from './../../../components/ui/';
import Yu from './../../../assets/images/profile/profile.jpg';


export default function ServicesPage() {
    const SERVICE_CATEGORIES = ["All", "Restaurant", "Cafe", "Hospitals", "Pharmacy", "Grocery", "Salon", "Spa", "Gym"];
    const FILTER_OPTIONS = ["Sort By Nearest", "Sort By Rating", "Open Now"];

    const [activeTab, setActiveTab] = useState(SERVICE_CATEGORIES[0]);
    const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS[0]);

    return (
        <div className="services-page">
            <header className='flex justify-end p-medium'>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header>

            <section className='p-medium'>
                <Title>Good Day, <span className='text-accent'>Yu!</span></Title>
                <Heading>What services do you want to find today?</Heading>
                <InputField className='border-roundify py-medium' icon="search" placeholder="Search for services..." />
                <Tab className='py-medium'
                    value={activeTab}
                    options={SERVICE_CATEGORIES} 
                    onChange={setActiveTab} 
                    activeClassName='fw-bold'
                />
            </section>

            <section className='px-medium flex justify-between'>
                <Heading><em className='fw-bold'>{activeTab} Services</em></Heading>
                {/* <Dropdown value={activeFilter} onChange={setActiveFilter} options={FILTER_OPTIONS}/> */}
            </section>
            
            {/* 
            <section className='px-medium'>
            </section> */}        
        </div>
    );
}