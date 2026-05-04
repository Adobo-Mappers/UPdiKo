import './Card.css'
import { Heading, Text } from '../../typography';
import { Icon, Tag } from '../';

export function Card({service, className, ...otherProps}) {
    return (
        <div className={`card ${className}`} {...otherProps}>
            <div className='image-section'>
                {service.images[0]
                    ? ( 
                        <img
                            src={service.images[0]}
                        />
                    ) 
                    : (
                        <div className='bg-component'></div>
                    )
                }
            </div>
                
            <div>
                <Text><em className='fw-bold'>{service.name}</em></Text>
                <div className='flex gap-xsmall my-small'>
                    <Icon name='address' size='small' />
                    <Text><em className='fw-regular'>s{service.address}</em></Text>
                </div>
                {/* <Tag className="my-medium">{service.tags[0]}</Tag> */}
            </div>
        </div>
    );   
}