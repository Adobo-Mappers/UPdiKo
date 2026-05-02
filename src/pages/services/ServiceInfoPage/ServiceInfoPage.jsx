import './ServiceInfoPage.css'
import { Link } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading } from './../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function ServicesInfoPage() {
    return (
        <div className="service-info-page">
            <header className='px-large py-medium  flex justify-between'>
                <Link to="/service" className='flex items-center gap-small'>
                    <Icon name="back" size='small'/>
                    <Text>Back</Text>
                </Link>
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header> 
            <section className='px-medium'>
                <Carousel imageUrls={[Yu, Yu]}/>   
            </section>
            <section className='px-large py-medium '>
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
                <div className='flex gap-small my-medium'>
                    <Link to="/map">
                        <Button className="flex items-center gap-xsmall">
                            <Icon name='direction'/>
                            <Caption>Get Directions</Caption>
                        </Button>
                    </Link>
                    <Link to="/map">
                        <Button className="flex items-center gap-xsmall">
                            <Icon name='map'/>
                            <Caption>View in Map</Caption>
                        </Button>
                    </Link>
                </div>
            </section>
            <section className='px-medium'>
                <Text className='text-muted text-indent'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin id turpis ligula. Morbi dignissim efficitur tellus, a vehicula dui imperdiet vitae. Morbi pharetra diam urna, at feugiat velit eleifend vel. Nulla vitae felis et justo fringilla posuere. Vestibulum semper nec magna nec vehicula. Etiam vulputate lacus vel mattis laoreet.</Text>
            </section>
            <section className='px-large py-medium '>
                <div className='flex items-center gap-small my-xsmall'><Icon name='mail'/><Text><em className='text-muted'>Email</em></Text></div>
                <div className='flex items-center gap-small my-xsmall'><Icon name='phone'/><Text><em className='text-muted'>Phone</em></Text></div>  
            </section>
        </div>
    )
}