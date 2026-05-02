import './ForgotPasswordPage.css';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon, Carousel, Tag } from '../../../components/ui';
import { Text, Caption, Heading, Title } from '../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function ForgotPassword() {
    return (
        <div className="forgot-password-page">
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

                <Title>Password <em className='text-accent'>Recovery</em></Title>
                <Heading>Enter your <em className='fw-bold'>email address</em> to receive a password reset link.</Heading>

                <form className='my-large'>
                    <div className='my-medium'>
                        <InputField className='border-roundify py-medium' icon="mail" placeholder="Email" />
                    </div>
                    <div className='flex justify-center my-large'>
                        <Link to="/account">
                            <Button className='w-200'>Send Reset Link</Button>
                        </Link>
                    </div>                     
                </form>
            </main>
        </div>
    );
}   