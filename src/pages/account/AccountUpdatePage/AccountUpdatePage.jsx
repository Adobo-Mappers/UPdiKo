import './AccountUpdatePage.css';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, InputField, PasswordField } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { Text, Heading, Title } from '../../../components/typography';
import { NOTIFICATION_ACTIONS, notifyAction } from '../../../services/notificationCenter';
import {
    getCurrentUser,
    updateUserProfile,
    updateUserPassword,
    saveUserDataToDB,
} from '../../../services/supabase';

export default function AccountUpdatePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    useEffect(() => {
        getCurrentUser().then((u) => {
            setUser(u);
            if (u) setDisplayName(u.user_metadata?.display_name ?? '');
        });
    }, []);

    const [displayName, setDisplayName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    function mapError(error) {
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('password should be at least') || msg.includes('weak password'))
            return 'Password must be at least 6 characters.';
        if (msg.includes('invalid login credentials') || msg.includes('password'))
            return 'Password is incorrect.';
        return 'Unable to update account';
    }

    async function handleUpdate() {
        if (!displayName) {
            notifyAction(NOTIFICATION_ACTIONS.ACCOUNT_UPDATE, 'error', {
                message: 'Please complete all required fields',
            });
            return;
        }

        try {
            await updateUserProfile({ displayName });
            if (newPassword.trim()) { setShowConfirm(true); return; }
            await saveUserDataToDB(user.id, { name: displayName });
            notifyAction(NOTIFICATION_ACTIONS.ACCOUNT_UPDATE, 'success');
            navigate('/account');
        } catch (e) {
            notifyAction(NOTIFICATION_ACTIONS.ACCOUNT_UPDATE, 'error', {
                message: mapError(e),
            });
        }
    }

    async function handlePasswordConfirm() {
        try {
            setShowConfirm(false);
            await updateUserPassword(newPassword.trim(), currentPassword);
            await saveUserDataToDB(user.id, { name: displayName });
            notifyAction(NOTIFICATION_ACTIONS.ACCOUNT_UPDATE, 'success');
            navigate('/account');
        } catch (e) {
            notifyAction(NOTIFICATION_ACTIONS.ACCOUNT_UPDATE, 'error', {
                message: mapError(e),
            });
        }
    }

    if (!user) return null;

    return (
        <div className="account-update-page px-xlarge">
            {/* Main structural wrapper matched with RegisterPage layout formatting */}
            <main className='flex flex-col justify-center p-xlarge bg-white border-roundify'>
                <div className='py-medium'>
                    <Link to="/account" className='flex items-center gap-small'>
                        <Icon name="back" size='small' />
                        <Text>Back</Text>
                    </Link>
                </div>

                <div>
                    <Heading className='fw-extra-bold py-xsmall'>User</Heading>
                    <Title className='fw-extra-bold lh-large mb-small'>Update Account</Title>
                    <Heading className='mx-small my-medium'>
                        Edit your username or password.
                    </Heading>
                </div>

                <form className='px-small'>
                    
                    <div className='my-medium'>
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

                    {/* Integrated centered button submission container matching RegisterPage style rules */}
                    <div className='flex justify-center my-large'>
                        <Button 
                            type="button" 
                            className='py-medium bg-color-none border-solid fs-heading' 
                            width='250px' 
                            onClick={handleUpdate}
                        >
                            Update
                        </Button>
                    </div>
                </form>
            </main>

            {showConfirm && (
                <div className='modal-container flex justify-center items-center px-xlarge'>
                    <div className='w-100 flex flex-col justify-center p-xlarge bg-white border-roundify' style={{'height': 'auto'}} >
                        <Heading className='fw-extra-bold'>Enter current password to confirm</Heading>
                        <div className='py-medium px-small'>
                            <PasswordField
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                className='border-roundify py-medium'
                            />
                            <div className='flex gap-medium justify-end pt-medium'>
                                <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
                                <Button className="border-solid" onClick={handlePasswordConfirm}>Confirm</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
