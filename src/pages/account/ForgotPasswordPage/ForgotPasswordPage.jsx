import './ForgotPasswordPage.css';
import { Link } from 'react-router-dom';
import { Button, InputField } from '../../../components/form';
import { Icon, Carousel, Tag } from '../../../components/ui';
import { Text, Caption, Heading, Title } from '../../../components/typography'
import Yu from './../../../assets/images/profile/profile.jpg';

export default function ForgotPassword() {
    
    const onSubmit = (data) => {
        // Handle password reset logic here
        console.log(data);
    };

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

                <form className='my-large' onSubmit={handleSubmit(onSubmit)}>
                    <div className='my-medium'>
                        <InputField 
                            className='border-roundify py-medium' 
                            icon="mail" 
                            placeholder="Email" 
                            {...register('email', { required: 'Email is required' })}
                        />
                        {errors.email && <Text className='text-muted'>{errors.email.message}</Text>}
                    </div>
                    <div className='flex justify-center my-large'>
                        <Button className='w-200' type='submit'>Send Reset Link</Button>
                    </div>                     
                </form>
            </main>
        </div>
    );
}   