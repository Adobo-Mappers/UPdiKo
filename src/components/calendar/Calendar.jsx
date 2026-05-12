import './Calendar.css';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState, useEffect } from 'react';
import { Text, Heading, Caption } from '../typography';
import { Icon } from '../ui';
import { getPinnedLocationsFromDB, getCurrentUser } from '../../services/supabase';

function CalendarView() {
    const [date, setDate] = useState(new Date());
    const [pins, setPins] = useState([]);

    // Load user's pinned locations to show on calendar
    useEffect(() => {
        const load = async () => {
            try {
                const user = await getCurrentUser();
                if (user) {
                    const locations = await getPinnedLocationsFromDB(user.id);
                    setPins(locations);
                }
            } catch (error) {
                console.error('Error loading pins for calendar:', error);
            }
        };
        load();
    }, []);

    const selectedDateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const pinsForDate = pins.filter(pin => {
        // Show all pins on selected date for now — can be refined when pins get a date field
        return true;
    });

    return (
        <div className='calendar-widget'>
            <Heading><em className='fw-bold'>Calendar</em></Heading>
            <div className='calendar-container'>
                <ReactCalendar
                    value={date}
                    onChange={setDate}
                    className='updi-calendar'
                />
            </div>
            {pins.length > 0 && (
                <div className='calendar-pins'>
                    <Caption className='text-muted'>Your saved pins</Caption>
                    {pinsForDate.map(pin => (
                        <div key={pin.id} className='calendar-pin-item flex items-center gap-small'>
                            <Icon name='map' size='small' />
                            <div>
                                <Text><em className='fw-bold'>{pin.locationName}</em></Text>
                                <Caption className='text-muted'>{pin.address}</Caption>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CalendarView;
