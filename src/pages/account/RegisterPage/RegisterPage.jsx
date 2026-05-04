import './RegisterPage.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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
        console.log("hello");
        if (!username || !email || !password || !confirmPassword) {
            setErrorMessage("Please fill in all the required fields.");
            return;
        }

        try {
            // signUp now accepts name and stores it in Supabase Auth user_metadata
            const newUserCredential = await signUp(email, password, username);

            // Save to public.users table using user.id (Supabase uses .id not .uid)
            await saveUserDataToDB(newUserCredential.id, {
              name,
              email
            });
            navigate('/service/');

        } catch (error) {   
            console.error("Error creating account:", error);
            setErrorMessage(mapSupabaseError(error));
        }
    }

    return (
        <div className="register-page">
            <main className='flex flex-col justify-center px-large py-medium'>
                <div className='py-medium'>
                    <Link to="/account/login" className='flex items-center gap-small'>
                        <Icon name="back" size='small'/>
                        <Text>Back</Text>
                    </Link>               
                </div>
                <Title>User <em className='text-accent'>Sign Up</em></Title>

                {errorMessage && (
                    <div className='my-medium p-medium border-roundify bg-accent-softer'>
                        <Text>{errorMessage}</Text>
                    </div>
                )}

                <form>
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
                    
                    <div className='my-medium'>
                        <PasswordField 
                            className='border-roundify py-medium' 
                            placeholder="Confirm Password" 
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                        />
                    </div>
        
                    <div className='flex justify-center my-large'>
                        <Button type="button" className='py-medium' width='200px' onClick = {() => handleRegister()}>Register</Button>
                    </div>
                    
                    <div className='flex justify-center my-large'>
                        <Text>Already have an account? <Link to="/account/login" className='text-decoration-none'><u>Sign in here</u></Link></Text>
                    </div>
                </form>
            </main>
        </div>
    );
}   