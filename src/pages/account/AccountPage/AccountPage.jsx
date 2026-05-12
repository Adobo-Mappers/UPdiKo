import './AccountPage.css';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/form';
import { Icon, Profile } from '../../../components/ui';
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
        <div className='account-page'>
            <header className='flex justify-between items-center px-large py-medium'>
                <div className='flex items-center gap-medium'>
                    <Profile user={user} width='48px' height='48px' />
                    <div>
                        <Text><em className='fw-bold'>{user.user_metadata?.display_name ?? 'User'}</em></Text>
                        <Text className='text-muted'>{user.email}</Text>
                    </div>
                </div>
                <Icon name='logout' size='medium' className='cursor-pointer' onClick={handleLogOut} />
            </header>

            <main className='px-large py-medium'>
                <Title>Dashboard</Title>
                <Heading className='my-small'>Good day! What do you want to do today?</Heading>

                <div className='flex flex-col gap-medium my-large'>
                    <Link to='/account/update' className='option-card flex items-center gap-medium p-large border-rounded bg-component'>
                        <Icon name='edit' size='large' />
                        <div>
                            <Text><em className='fw-bold'>Update Account</em></Text>
                            <Text className='text-muted'>Change your display name or password</Text>
                        </div>
                    </Link>
                    <Link to='/account/pins' className='option-card flex items-center gap-medium p-large border-rounded bg-component'>
                        <Icon name='map' size='large' />
                        <div>
                            <Text><em className='fw-bold'>Your Personal Pins</em></Text>
                            <Text className='text-muted'>Manage your created map pins</Text>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}
