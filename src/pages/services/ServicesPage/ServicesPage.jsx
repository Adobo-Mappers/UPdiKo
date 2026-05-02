import './ServicesPage.css';
import { act, useEffect, useState } from 'react';
import { Button, InputField } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon } from './../../../components/ui/';
import Yu from './../../../assets/images/profile/profile.jpg';


export default function ServicesPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [activeFilter, setActiveFilter] = useState("Sort By Nearest");

    console.log(activeTab, activeFilter);

    return (
        <div className="services-page">
            <header className='flex justify-end p-medium'>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header>

            <section className='px-medium'>
                <Title>Good Day, <span className='text-accent'>Yu!</span></Title>
                <Heading>What services do you want to find today?</Heading>
                <InputField className='border-roundify py-medium' icon="search" placeholder="Search for services..." />
                {/* <Tab className='' value={activeTab} options={["All", "Restaurant", "Cafe", "Hospitals"]} onChange={setActiveTab}/>  */}
            </section>

            {/* <section className='px-medium flex justify-between'>
                <Heading>{activeTab} Services</Heading>
                <Dropdown value={activeFilter} onChange={setActiveFilter} options={["Sort By Nearest", "Sort By Rating", "Open Now"]}/>
            </section>

            <section className='px-medium'>
            </section> */}        
        </div>
    );
}