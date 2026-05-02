import './ServicesPage.css';
import { useState } from 'react';
import { Button, InputField } from './../../../components/form/';
import { Caption, Heading, Text, Title } from './../../../components/typography/';
import { Icon, Tab } from './../../../components/ui/';
import Yu from './../../../assets/images/profile/profile.jpg';


export default function ServicesPage() {
    const [activeTab, setActiveTab] = useState("All");

    return (
        <div className="services-page">
            <header className='flex justify-end p-medium'>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header>

            <section className='px-medium'>
                <Title>Good Day, <span className='text-accent'>Yu!</span></Title>
                <Heading>What services do you want to find today?</Heading>
                <InputField className='border-roundify py-medium' icon="search" placeholder="Search for services..." />

                <Tab value={activeTab} options={["All", "Restaurant", "Cafe", "Hospital"]}></Tab>
            </section>


        </div>
    );

    //     const [activeTab, setActiveTab] = useState('All');
//     const [activeFilter, setActiveFilter] = useState('sort-by-nearest'); 

//     return (
//         <div className="services-page">
//             <header>    
//                 <Profile src={userProfileImg}/>            
//             </header>

//             <section className='greeting-section'>
//                 <Title>Good Day, <Emphasis type='accent'>Yu!</Emphasis></Title>
//                 <Heading>What services do you want to find today?</Heading>
//             </section>
            
//             <section className='search-section'>
//                 <SearchBar placeholder='Search for services...'/>
//             </section>

//             <section className='category-section'> 
//                 <Tab>
//                     <TabLink label='All' active={activeTab === 'All'} onClick={() => setActiveTab('All')}/>
//                     <TabLink label='Home' active={activeTab === 'Home'} onClick={() => setActiveTab('Home')}/>
//                     <TabLink label='Auto' active={activeTab === 'Auto'} onClick={() => setActiveTab('Auto')}/>
//                     <TabLink label='Health' active={activeTab === 'Health'} onClick={() => setActiveTab('Health')}/>
//                     <TabLink label='Education' active={activeTab === 'Education'} onClick={() => setActiveTab('Education')}/>
//                     <TabLink label='More' active={activeTab === 'More'} onClick={() => setActiveTab('More')}/>
//                 </Tab>
//             </section>

//             <section className='service-list-section'>
//                 <div className='service-list-header'>
//                     <Heading><Emphasis weight='bold'>{activeTab} Services</Emphasis></Heading>
//                     <Dropdown value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
//                         <DropdownOption value='sort-by-nearest' label='Sort by Nearest'/>
//                         <DropdownOption value='sort-by-rating' label='Sort by Rating'/>
//                         <DropdownOption value='open-today' label='Open Today'/>
//                     </Dropdown>
//                 </div>

//                 <hr/>
                
//                 <div className='service-list-body'>
//                     {/* To be committed */}
//                 </div>
//             </section>
//         </div>
//     );
}