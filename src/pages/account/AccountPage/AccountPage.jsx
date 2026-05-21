import './AccountPage.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import { getCurrentUser, logOut } from '../../../services/supabase';

export default function AccountPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        getCurrentUser().then((u) => {
            if (!u) navigate('/account/login');
            else setUser(u);
        });
    }, [navigate]);

    async function handleLogOut() {
        await logOut();
        navigate('/account/login');
    }

    if (!user) return null;

    return (
        <div className='account-page px-xlarge'>
            <main className='py-xlarge flex flex-col justify-center '>
                <div className='flex flex-col p-xlarge border-roundify bg-white'>
                    <div className='flex justify-between my-smal'>
                        <div className='flex items-center gap-medium'>
                            <Icon name='sunflower' size='xlarge' className='account-profile-icon' />
                            <div>
                                <Heading className='fw-extra-bold'>{user.user_metadata?.display_name ?? 'User'}</Heading>
                                <Text>{user.email}</Text>
                            </div>
                        </div>
                        <div className='flex items-center gap-xsmall'>
                            <Icon name='logout' size='medium' className='cursor-pointer' onClick={handleLogOut} />
                            <Text className='cursor-pointer fw-bold' onClick={handleLogOut}>Log Out</Text>
                        </div>
                    </div>
                    
                    <Title className='mt-xlarge'>Dashboard</Title>
                    <Heading>Good day! What do you want to do today?</Heading>
                </div>
                <div className='flex flex-col gap-medium my-large'>
                    <Link to='/account/update'  style={{'display':'grid', 'gridTemplateColumns': '24px 1fr 24px'}} className='gap-large p-xlarge border-roundify bg-white cursor-pointer'>
                        <Icon name='edit' size='large'/>
                        <div>
                            <Heading className='fw-extra-bold'>Update Account</Heading>
                            <Text className='fw-regular'>Change your display name or password</Text>
                        </div>
                        <div className=' flex items-center'>
                            <Icon name='front'/>
                        </div>
                    </Link>
                    <Link to='/account/pins' style={{'display':'grid', 'gridTemplateColumns': '24px 1fr 24px'}} className='gap-large p-xlarge border-roundify bg-white cursor-pointer'>
                        <Icon name='map' size='large' />
                        <div>
                            <Heading className='fw-extra-bold'>Your Personal Pins</Heading>
                            <Text className='fw-regular'>Manage your created map pins</Text>
                        </div>
                        <div className=' flex items-center'>
                            <Icon name='front'/>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
