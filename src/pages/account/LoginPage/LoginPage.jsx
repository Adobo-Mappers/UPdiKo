import './LoginPage.css';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading, Title } from './../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function LoginPage() {
    return (
        <div className="login-page">
            <header className="py-medium px-large flex justify-end">
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header> 
            <main className='px-large py-medium'>
                <Title>User <em className='text-accent'>Login</em></Title>
                <Heading>Access personalized features like <em className='fw-bold'>bookmarking pins</em> and <em className='fw-bold'>creating custom pins. </em></Heading>

                <form className='my-large'>
                    <InputField className='border-roundify my-medium' icon="mail" placeholder="Email" />
                    <InputField className='border-roundify my-medium' icon="password" placeholder="Password" type="password"/>
                    <div className='flex justify-end'>
                        <Link to="/account/forgot-password" className='text-decoration-none'>
                            <Text><u>Forgot Password</u></Text>
                        </Link>
                    </div>
                    <div className='flex justify-center my-large'>
                        <Link to="/account" className='text-decoration-none'>
                            <Button className='w-200'>Login</Button>
                        </Link>
                    </div>
                    <div className='flex justify-center my-large'>
                        <Text>Don't have an account? <Link to="/account/register" className='text-decoration-none'><u>Sign up here</u></Link></Text>
                    </div>
                </form>
            </main>
        </div>
    );
}   