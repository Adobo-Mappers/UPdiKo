import './ForgotPasswordPage.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import { sendPasswordReset } from '../../../services/supabase.js';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit() {
        setErrorMessage('');
        setSuccessMessage('');

        if (!email.trim()) {
            setErrorMessage('Please enter your email address.');
            return;
        }

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
        <div className="forgot-password-page">
            <main className='flex flex-col justify-center px-large py-medium'>
                <div className='py-medium'>
                    <Link to="/account/login" className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                </div>

                <Title>Password <em className='text-accent'>Recovery</em></Title>
                <Heading>Enter your <em className='fw-bold'>email address</em> to receive a password reset link.</Heading>

                {errorMessage && (
                    <div className='my-medium p-medium border-roundify bg-accent-softer'>
                        <Text>{errorMessage}</Text>
                    </div>
                )}
                {successMessage && (
                    <div className='my-medium p-medium border-roundify' style={{backgroundColor: '#d4edda'}}>
                        <Text>{successMessage}</Text>
                    </div>
                )}

                <div className='my-large'>
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
                            width="200px"
                            onClick={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
