import './Card.css'
import { Heading, Text } from '../../typography';
import { Icon, Tag } from '../';

export function Card({service, className, ...otherProps}) {
    return (
        <div className={`card ${className}`} {...otherProps}>
            <div className='image-section flex'>
                {service.images[0]
                    ? ( 
                        <img
                            src={service.images[0]}
                            style={{borderTopRightRadius: "0px", borderBottomRightRadius: "0px"}}
                        />
                    ) 
                    : (
                        <div className='bg-component'                             
                            style={{borderTopRightRadius: "0px", borderBottomRightRadius: "0px"}}
                        ></div>
                    )
                }
            </div>
                
            <div className='py-small px-medium'>
                <Heading><em className='fw-bold'>{service.name}</em></Heading>
                <div className='flex gap-xsmall my-small'>
                    <Icon name='address' size='small' />
                    <Text><em className='fw-regular'>{service.address}</em></Text>
                </div>
                {/* <Tag className="my-medium">{service.tags[0]}</Tag> */}
            </div>
        </div>
    );   
}