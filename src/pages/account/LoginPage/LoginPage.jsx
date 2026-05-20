import './LoginPage.css';
import { useState, useEffect } from 'react';
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
    
    useEffect(() => {
        if (errorMessage === "") { 
            return;
        }
        
        const timer = setTimeout(() => {
            setErrorMessage("");
        }, 15000);
        
        return () => clearTimeout(timer);
    }, [errorMessage]);
    

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
        <div className="login-page px-xlarge"> 
            <main className='flex flex-col justify-center p-xlarge bg-white border-roundify'>
                <div>
                    <Heading className='fw-extra-bold py-xsmall'>User</Heading>
                    <Title className='fw-extra-bold lh-large'>Login</Title>
                </div>

                <form className='pt-small px-small'>
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
                    
                    <div className='flex justify-end px-small'>
                        <Link to="/account/forgot-password" className='text-decoration-none'>
                            <Text className='fw-extra-bold'><u>Forgot Password</u></Text>
                        </Link>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Button type="button" className='py-medium bg-color-none border-solid fs-heading' width='250px' onClick = {() => handleLogin()}>Login</Button>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Text>Don't have an account? <Link to="/account/register" className='text-decoration-none fw-extra-bold'><u>Sign up here</u></Link></Text>
                    </div>
                </form>
            </main>
                            
            {errorMessage && (
                <div id="error-message-toast" className='flex justify-between items-center bg-accent-softer py-medium px-large m-xlarge border-roundify'>
                    <Text className='mr-xlarge'>{errorMessage}</Text>
                    <Icon name='close' size='small' className='cursor-pointer' onClick={() => setErrorMessage("")}/>
                </div>
            )}
        </div>
    );
}   