import './ServiceInfoPage.css'
import { Link } from 'react-router-dom';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading } from './../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function ServicesInfoPage() {
    return (
        <div className="service-info-page">
            <header className='p-medium flex justify-between'>
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small'/>
                    <Text><em className='fw-bold'>Back</em></Text>
                </Link>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header> 
            <section className='px-medium'>
                <Carousel imageUrls={[Yu, Yu]}/>   
            </section>
            <section className='p-medium'>
                <div className='flex justify-end'>
                    <Tag>Category</Tag>
                </div>
                <div className='py-small flex justify-between'>
                    <Heading><em className='fw-bold'>Balay Kanlaon</em></Heading>
                    <div className='flex items-center gap-small'>
                        <Icon name='star' size='small'/>
                        <Text>4.5 <em className="text-muted">(243 reviews)</em></Text>
                    </div>                    
                </div>
                <div className='flex-col'>
                    <div className='flex items-center gap-small my-xsmall'><Icon name='address'/><Text>University Dorm Area</Text></div>
                    <div className='flex items-center gap-small my-xsmall'><Icon name='clock'/><Text>10:00 AM - 5:00 PM (Monday)</Text></div>
                </div>
            </section>
        </div>
    )
}

// export default function ServicesInfoPage() {
//     return(
//         <div className="service-info-page">
//             <header>    
//                 <Link to="/services" className='hello'>
//                     <Label>
//                         <Icon src={backIcon}/>
//                         <Text><Emphasis weight='bold' type='default'>Back</Emphasis></Text>
//                     </Label>
//                 </Link>
//                 <Profile src={userProfileImg}/>            
//             </header>
        
//             <section className='carousel-section'>
//             </section>
            
//             <section className='info-section'>
//                 <div className='info-section-header'>
//                     <Tag>
//                         <Caption><Emphasis weight='bold'>Category</Emphasis></Caption>
//                     </Tag>
//                 </div>
                
//                 <div className='name-and-rating-container'>
//                     <Heading><Emphasis weight='bold'>Location Name</Emphasis></Heading>
//                     <Label>
//                         <Icon src={starIcon}/>
//                         <Text>4.5 <Emphasis type='muted'>(67 reviews)</Emphasis></Text>
//                     </Label>
//                 </div>
                
//                 <Label><Icon src={locationIcon}/><Text>Address</Text></Label>
//                 <Label><Icon src={openHoursIcon}/><Text>Opening Hours</Text></Label>                    
    
//                 <div className='button-container'>
//                     <Link to="/map">
//                         <Button>
//                             <Label>
//                                 <Icon src={directionIcon}/>
//                                 <Caption><Emphasis weight='bold'>Get Directions</Emphasis></Caption>
//                             </Label>
//                         </Button>
//                     </Link>

//                     <Link to="/map">
//                         <Button>
//                             <Label>
//                                 <Icon src={mapRedirectIcon}/>
//                                 <Caption><Emphasis weight='bold'>View in Map</Emphasis></Caption>
//                             </Label>
//                         </Button>
//                     </Link>
//                 </div>
                
//                 <div className='more-information'>
//                     <Text><Emphasis type='muted'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin id turpis ligula. Morbi dignissim efficitur tellus, a vehicula dui imperdiet vitae. Morbi pharetra diam urna, at feugiat velit eleifend vel. Nulla vitae felis et justo fringilla posuere. Vestibulum semper nec magna nec vehicula. Etiam vulputate lacus vel mattis laoreet.</Emphasis></Text>
//                 </div>
        
//                 <Label><Icon src={mailIcon}/><Text><Emphasis type='muted'>Email</Emphasis></Text></Label>
//                 <Label><Icon src={phoneIcon}/><Text><Emphasis type='muted'>Phone</Emphasis></Text></Label>
//             </section>
//         </div>

        
//     );
// }