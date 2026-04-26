import './ServicesPage.css';

import { useState } from 'react';

import Title from "../../../components/typography/Title/Title";
import Heading from "../../../components/typography/Heading/Heading";
import Text from "../../../components/typography/Text/Text";
import Emphasis from "../../../components/typography/Emphasis/Emphasis";
import Profile from "../../../components/ui/Profile/Profile";
import Tab from "../../../components/ui/Tab/Tab";
import TabLink from "../../../components/ui/Tab/TabLink";
import Label from '../../../components/ui/Label/Label';
import SearchBar from '../../../components/form/SearchBar/SearchBar';
import Dropdown from '../../../components/form/Dropdown/Dropdown';
import DropdownOption from '../../../components/form/Dropdown/DropdownOption';

import locationIcon from '../../../assets/images/icon/location-icon.png';
import backIcon from '../../../assets/images/icon/back-icon.png';
import userProfileImg from '../../../assets/images/profile/profile.jpg';
import exampleImage from '../../../assets/images/location/Nuladas/IMG_20251027_113359-min.jpg'

export default function ServicesPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [activeFilter, setActiveFilter] = useState('sort-by-nearest'); 

    return (
        <div className="services-page">
            <header>    
                <Profile src={userProfileImg}/>            
            </header>

            <section className='greeting-section'>
                <Title>Good Day, <Emphasis type='accent'>Yu!</Emphasis></Title>
                <Heading>What services do you want to find today?</Heading>
            </section>
            
            <section className='search-section'>
                <SearchBar placeholder='Search for services...'/>
            </section>

            <section className='category-section'> 
                <Tab>
                    <TabLink label='All' active={activeTab === 'All'} onClick={() => setActiveTab('All')}/>
                    <TabLink label='Home' active={activeTab === 'Home'} onClick={() => setActiveTab('Home')}/>
                    <TabLink label='Auto' active={activeTab === 'Auto'} onClick={() => setActiveTab('Auto')}/>
                    <TabLink label='Health' active={activeTab === 'Health'} onClick={() => setActiveTab('Health')}/>
                    <TabLink label='Education' active={activeTab === 'Education'} onClick={() => setActiveTab('Education')}/>
                    <TabLink label='More' active={activeTab === 'More'} onClick={() => setActiveTab('More')}/>
                </Tab>
            </section>

            <section className='service-list-section'>
                <div className='service-list-header'>
                    <Heading><Emphasis weight='bold'>{activeTab} Services</Emphasis></Heading>
                    <Dropdown value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                        <DropdownOption value='sort-by-nearest' label='Sort by Nearest'/>
                        <DropdownOption value='sort-by-rating' label='Sort by Rating'/>
                        <DropdownOption value='open-today' label='Open Today'/>
                    </Dropdown>
                </div>

                <hr/>
                
                <div className='service-list-body'>
                    {/* To be committed */}
                </div>
            </section>
        </div>
    );
}