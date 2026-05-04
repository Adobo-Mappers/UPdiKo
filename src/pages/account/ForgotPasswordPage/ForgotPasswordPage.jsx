import './ForgotPasswordPage.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon, Carousel, Tag } from '../../../components/ui';
import { Text, Caption, Heading, Title } from '../../../components/typography'

export default function ForgotPassword() {
    // states 
    const [email, setEmail] = useState("");
    
    function handleSubmit() {
        // function logic 
    }

    return (
        <div className="forgot-password-page">
            <main className='flex flex-col justify-center px-large py-medium'>
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
                        <InputField 
                            className='border-roundify py-medium' 
                            icon="mail" 
                            placeholder="Email" 
                            value = {email}
                            onChange = {setEmail}        
                        />
                    </div>
                    <div className='flex justify-center my-large'>
                        <Button className='w-200' type='buttn' width="200px">Send Reset Link</Button>
                    </div>                     
                </form>
            </main>
        </div>
    );
}   