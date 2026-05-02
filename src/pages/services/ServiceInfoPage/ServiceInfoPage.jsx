// import './ServiceInfoPage.css'
// import { BrowserRouter, Link} from 'react-router-dom';

// import Icon from '../../../components/ui/Icon/Icon';
// import Heading from '../../../components/typography/Heading/Heading';
// import Text from '../../../components/typography/Text/Text';
// import Tag from './../../../components/ui/Tag/Tag';
// import Caption from './../../../components/typography/Caption/Caption';
// import Label from '../../../components/ui/Label/Label';
// import Profile from "../../../components/ui/Profile/Profile";
// import Emphasis from '../../../components/typography/Emphasis/Emphasis';

// import phoneIcon from '../../../assets/images/icon/phone-icon.png';
// import mailIcon from '../../../assets/images/icon/mail-icon.png';
// import openHoursIcon from '../../../assets/images/icon/open-hours-icon.png';
// import mapRedirectIcon from '../../../assets/images/icon/maps-pin-solid-icon.png';
// import directionIcon from '../../../assets/images/icon/directions-icon.png';
// import locationIcon from '../../../assets/images/icon/location-icon.png';
// import starIcon from '../../../assets/images/icon/star-icon.png';
// import backIcon from './../../../assets/images/icon/back-to-icon.png';
// import userProfileImg from '../../../assets/images/profile/profile.jpg';
// import Button from '../../../components/form/Button/Button';

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