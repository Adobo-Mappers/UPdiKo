import './RegisterPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon, Carousel, Tag } from '../../../components/ui';
import { Text, Caption, Heading, Title } from '../../../components/typography'
import { signUp, saveUserDataToDB } from "../../../services/supabase.js";

export default function RegisterPage() {
    // URL redirect hook
    const navigate = useNavigate();

    // states
    const [username, setUsername] = useState("");
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
    


    // map supabase errors to be displayed 
    function mapSupabaseError(error) {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("user already registered") || msg.includes("already been registered")) {
            return "This email address is already registered. Please log in.";
        }
        if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
            return "The email address is not in a valid format.";
        }
        if (msg.includes("password should be at least") || msg.includes("weak password")) {
            return "The password must be at least 6 characters long.";
        }
        return "Registration failed. Please check your inputs and try again.";
    };

    async function handleRegister() {
        setErrorMessage('');
        if (!username || !email || !password) {
            setErrorMessage("Please fill in all the required fields.");
            return;
        }

        try {
            // signUp now accepts name and stores it in Supabase Auth user_metadata
            const newUserCredential = await signUp(email, password, username);

            // Save to public.users table using user.id (Supabase uses .id not .uid)
            await saveUserDataToDB(newUserCredential.id, {
              name: username,
              email
            });
            navigate('/service/');

        } catch (error) {   
            console.error("Error creating account:", error);
            setErrorMessage(mapSupabaseError(error));
        }
    }

    return (
        <div className="register-page px-xlarge">
            <main className='flex flex-col justify-center p-xlarge bg-white border-roundify'>
                <div>
                    <Heading className='fw-extra-bold py-xsmall'>User</Heading>
                    <Title className='fw-extra-bold lh-large'>Sign Up</Title>
                </div>

                <form className='pt-small px-small'>
                    <div className='my-medium'>
                        <InputField 
                            className='border-roundify py-medium' 
                            icon="user" 
                            placeholder="Username" 
                            value={username}
                            onChange={setUsername}
                        />
                    </div>

                    <div className='my-medium'>
                        <InputField 
                            className='border-roundify py-medium' 
                            icon="mail" 
                            placeholder="Email" 
                            value={email}
                            onChange={setEmail}
                        />
                    </div>
                    
                    <div className='my-medium'>
                        <PasswordField 
                            className='border-roundify py-medium' 
                            placeholder="Password" 
                            value={password}
                            onChange={setPassword}
                        />
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Button type="button" className='py-medium bg-color-none border-solid fs-heading' width='250px' onClick = {() => handleRegister()}>Register</Button>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Text>Already have an account? <Link to="/account/login" className='text-decoration-none'><u>Sign in here</u></Link></Text>
                    </div>
                </form>
            </main>
            
            {errorMessage && (
                <div id="error-message-toast" className=' toast flex justify-between items-center bg-danger py-medium px-large m-xlarge border-roundify'>
                    <Text className='mr-xlarge text-danger'>{errorMessage}</Text>
                    <Icon name='close' size='small' className='cursor-pointer' onClick={() => setErrorMessage("")}/>
                </div>
            )}

        </div>
    );
}   