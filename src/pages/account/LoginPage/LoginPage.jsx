import './LoginPage.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon, Carousel, Tag } from './../../../components/ui';
import { Text, Caption, Heading, Title } from './../../../components/typography'
import { logIn } from './../../../services/supabase.js';

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
            navigate("/service/");
        } catch (e) {
            setErrorMessage("Invalid Email or Password Found.");
            return;   
        }   
    }

    return (
        <div className="login-page"> 
            <main className='flex flex-col justify-center px-large py-medium'>
                <Title>User <em className='text-accent'>Login</em></Title>
                <Heading>Access personalized features like <em className='fw-bold'>bookmarking pins</em> and <em className='fw-bold'>creating custom pins. </em></Heading>

                {errorMessage && (
                    <div className='my-medium p-medium border-roundify bg-accent-softer'>
                        <Text>{errorMessage}</Text>
                    </div>
                )}

                <form>
                    <div className='my-medium'>
                        <InputField 
                            className='border-roundify py-medium email' 
                            icon="mail" 
                            placeholder="Email"
                            value={email}
                            onChange={setEmail}
                        />
                    </div>

                    <div className='my-medium'>
                        <PasswordField 
                            className='border-roundify py-medium password' 
                            placeholder="Password"
                            name="password"
                            value={password}
                            onChange={setPassword}
                    />
                    </div>
                    
                    <div className='flex justify-end'>
                        <Link to="/account/forgot-password" className='text-decoration-none'>
                            <Text><u>Forgot Password</u></Text>
                        </Link>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Button type="button" className='py-medium' width='200px' onClick = {() => handleLogin()}>Login</Button>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Text>Don't have an account? <Link to="/account/register" className='text-decoration-none'><u>Sign up here</u></Link></Text>
                    </div>
                </form>
            </main>
        </div>
    );
}   