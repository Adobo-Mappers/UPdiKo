import './ForgotPasswordPage.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import { sendPasswordReset } from '../../../services/supabase.js';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    async function handleSubmit() {
        setErrorMessage('');
        setSuccessMessage('');

        if (!email.trim()) {
            setErrorMessage('Please enter your email address.');
            return;
        }

        useEffect(() => {
            if (errorMessage === "") { 
                return;
            }
            
            const timer = setTimeout(() => {
                setErrorMessage("");
            }, 15000);
            
            return () => clearTimeout(timer);
        }, [errorMessage]);
        
        try {
            setIsLoading(true);
            await sendPasswordReset(email.trim());
            setSuccessMessage('Password reset link sent! Please check your inbox.');
        } catch (e) {
            const msg = e.message?.toLowerCase() ?? '';
            if (msg.includes('rate limit')) {
                setErrorMessage('Too many requests. Please wait a moment before trying again.');
            } else if (msg.includes('invalid email')) {
                setErrorMessage('The email address is not valid.');
            } else {
                setErrorMessage('Could not send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="forgot-password-page px-xlarge">
            <main className='flex flex-col justify-center p-xlarge bg-white border-roundify'>
                <div className='py-medium'>
                    <Link to="/account/login" className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                </div>

                <div>
                    <Heading className='fw-extra-bold py-xsmall'>Password</Heading>
                    <Title className='fw-extra-bold lh-large'>Recovery</Title>
                </div>
                <Heading className='pt-medium px-small'>Enter your <em className='fw-bold'>email address</em> to receive a password reset link.</Heading>
                
                <form className='pt-small px-small'>
                    <div className='my-medium'>
                        <InputField
                            className='border-roundify py-medium'
                            icon="mail"
                            placeholder="Email"
                            value={email}
                            onChange={setEmail}
                        />
                    </div>

                    
                    <div className='flex justify-center my-large'>
                        <Button
                            className='py-medium bg-color-none border-solid fs-heading' width='250px' 
                            width="200px"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </div>
                </form>
            </main>
            
            {errorMessage && (
                <div id="error-message-toast" className='toast flex justify-between items-center bg-danger py-medium px-large m-xlarge border-roundify'>
                    <Text className='mr-xlarge text-danger'>{errorMessage}</Text>
                    <Icon name='close' size='small' className='cursor-pointer' onClick={() => setErrorMessage("")}/>
                </div>
            )}

            {successMessage && (
                <div id="success-message-toast" className='toast flex justify-between items-center bg-success py-medium px-large m-xlarge border-roundify'>
                    <Text className='mr-xlarge text-success'>{errorMessage}</Text>
                    <Icon name='close' size='small' className='cursor-pointer' onClick={() => setErrorMessage("")}/>
                </div>
            )}

        </div>
    );
}
