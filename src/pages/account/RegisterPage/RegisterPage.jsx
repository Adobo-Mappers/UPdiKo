import './RegisterPage.css';
import { Link } from 'react-router-dom';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon, Carousel, Tag } from '../../../components/ui';
import { Text, Caption, Heading, Title } from '../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function RegisterPage() {
    return (
        <div className="register-page">
            <header className="py-medium px-large flex justify-end">
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header> 
            <main className='px-large py-medium'>
                <div className='py-medium'>
                    <Link to="/account/login" className='flex items-center gap-small'>
                        <Icon name="back" size='small'/>
                        <Text>Back</Text>
                    </Link>               
                </div>
                <Title>User <em className='text-accent'>Sign Up</em></Title>

                <form className='my-large'>
                    <div className='my-medium'>
                        <InputField className='border-roundify py-medium' icon="user" placeholder="Username" />
                    </div>
                    <div className='my-medium'>
                        <InputField className='border-roundify py-medium' icon="mail" placeholder="Email" />
                    </div>
                    <div className='my-medium'>
                        <PasswordField className='border-roundify py-medium' placeholder="Password" />
                    </div>
                    <div className='my-medium'>
                        <PasswordField className='border-roundify py-medium' placeholder="Confirm Password" />
                    </div>
        
                    <div className='flex justify-center my-large'>
                        <Link to="/account" className='text-decoration-none'>
                            <Button className='w-200'>Register</Button>
                        </Link>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Text>Already have an account? <Link to="/account/login" className='text-decoration-none'><u>Sign in here</u></Link></Text>
                    </div>
                </form>
            </main>
        </div>
    );
}   