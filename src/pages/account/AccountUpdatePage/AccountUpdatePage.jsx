import './AccountUpdatePage.css';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import {
    getCurrentUser,
    updateUserProfile,
    updateUserPassword,
    saveUserDataToDB,
    logOut,
} from '../../../services/supabase';

export default function AccountUpdatePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        getCurrentUser().then((u) => {
            setUser(u);
            if (u) setDisplayName(u.user_metadata?.display_name ?? '');
        });
    }, []);

    function mapError(error) {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('password should be at least') || msg.includes('weak password'))
            return 'Password must be at least 6 characters.';
        return 'Update failed. Please check your inputs and try again.';
    }

    async function handleUpdate() {
        setErrorMessage('');
        if (!displayName) { setErrorMessage('Display name is required.'); return; }
        try {
            await updateUserProfile({ displayName });
            if (newPassword.trim()) { setShowConfirm(true); return; }
            await saveUserDataToDB(user.id, { name: displayName });
            navigate('/account');
        } catch (e) { setErrorMessage(mapError(e)); }
    }

    async function handlePasswordConfirm() {
        try {
            await updateUserPassword(newPassword.trim(), currentPassword);
            await saveUserDataToDB(user.id, { name: displayName });
            navigate('/account');
        } catch (e) { setErrorMessage(mapError(e)); }
    }

    if (!user) return null;

    return (
        <div className="account-update-page">
            <main className='flex flex-col px-large justify-center'>
                <div className='py-medium'>
                    <Link to="/account" className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                </div>

                <Title>Update <em className='text-accent'>Account</em></Title>
                <Heading className='my-medium'>
                    Logged in as <em className='fw-bold'>{user.email}</em>
                </Heading>

                {errorMessage && (
                    <div className='my-medium p-medium border-roundify bg-accent-softer'>
                        <Text>{errorMessage}</Text>
                    </div>
                )}

                <div className='my-xsmall'>
                    <InputField
                        icon="user"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={setDisplayName}
                        className='border-roundify py-medium'
                    />
                </div>
                <div className='my-medium'>
                    <PasswordField
                        placeholder="New Password (optional)"
                        value={newPassword}
                        onChange={setNewPassword}
                        className='border-roundify py-medium'
                    />
                </div>
            </main>

            {showConfirm && (
                <div className='modal-overlay'>
                    <div className='modal-box p-large flex flex-col gap-medium border-rounded bg-white'>
                        <Text><em className='fw-bold'>Enter current password to confirm</em></Text>
                        <PasswordField
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={setCurrentPassword}
                            className='border-roundify py-medium'
                        />
                        {errorMessage && <Text className='text-accent'>{errorMessage}</Text>}
                        <div className='flex gap-medium justify-end'>
                            <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
                            <Button onClick={handlePasswordConfirm}>Confirm</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
