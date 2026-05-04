import './Profile.css'
import Yu from './../../../assets/images/profile/profile.jpg'

export function Profile({ user, width='36px', height='36px', className='', ...rest}) {
    return (
        (user) ? (
            <img 
                src={Yu} 
                alt='Yu Profile' 
                style={{'width': width, 'height': height}} 
                className={`profile ${className}`}
                {...rest}
            />
        ) :
        (   
            <div
                className={`profile ${className}`}
                style={{'width': width, 'height': height}} 
                {...rest}
            ></div>
        )
    )
}