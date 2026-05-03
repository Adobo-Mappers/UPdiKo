import './LoginPage.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading, Title } from './../../../components/typography'
import { logIn } from './../../../services/supabase.js';

import Yu from './../../../assets/images/profile/profile.jpg';

export default function LoginPage() {
    // URL redirect hook
    const navigate = useNavigate();
    
    // states 
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleLogin() {
        try {
            await logIn(email, password);
            if (error) throw error;
            navigate("/service/");
        } catch (e) {
            setErrorMessage("Invalid Email or Password Found.")
            return;   
        }   
    }

    return (
        <div className="login-page">
            <header className="py-medium px-large flex justify-end">
                <img className='border-circlify' src={Yu} alt="Yu Profile" width="36px" height="36px"/>
            </header> 
            <main className='px-large py-medium'>
                <Title>User <em className='text-accent'>Login</em></Title>
                <Heading>Access personalized features like <em className='fw-bold'>bookmarking pins</em> and <em className='fw-bold'>creating custom pins. </em></Heading>

                {errorMessage && (
                    <div className='my-medium p-medium border-roundify bg-accent-softer'>
                        <Text>{errorMessage}</Text>
                    </div>
                )}

                <form className='my-large'>
                    <div className='my-medium'>
                        <InputField 
                            className='border-roundify py-medium email' 
                            icon="mail" 
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className='my-medium'>
                        <PasswordField 
                            className='border-roundify py-medium password' 
                            placeholder="Password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                    />
                    </div>
                    <div className='flex justify-end'>
                        <Link to="/account/forgot-password" className='text-decoration-none'>
                            <Text><u>Forgot Password</u></Text>
                        </Link>
                    </div>
                    <div className='flex justify-center my-large'>
                        <Button type="button" className='w-200' onClick = {() => handleLogin()}>Login</Button>
                    </div>
                    <div className='flex justify-center my-large'>
                        <Text>Don't have an account? <Link to="/account/register" className='text-decoration-none'><u>Sign up here</u></Link></Text>
                    </div>
                </form>
            </main>
        </div>
    );
}   