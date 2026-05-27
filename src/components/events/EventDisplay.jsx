import './EventDisplay.css';
import { useEffect, useState } from 'react';
import customEvents from './custom-events.json';
import { Text, Caption, Heading } from '../typography';
import { Icon } from '../ui';

const MANILA_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

// e.g. "2026-05-11" → "May 11, 2026"
function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}

function EventDisplay() {
    const [todayEvents, setTodayEvents] = useState([]);
    const [todayStr, setTodayStr] = useState('');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const today = MANILA_FORMATTER.format(new Date());
        setTodayStr(today);

        const load = async () => {
            try {
                const res = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/ph', {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const holidays = await res.json();
                const all = [
                    ...customEvents,
                    ...holidays.map(h => ({ date: h.date, name: h.name })),
                ];
                setTodayEvents(all.filter(e => e.date === today));
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setTodayEvents(customEvents.filter(e => e.date === today));
                }
            } finally {
                setLoaded(true);
            }
        };

        load();
        return () => controller.abort();
    }, []);

    // Always show the card — either an event name or just today's date
    return (
        <div className='event-card px-small'>
            {(loaded && todayEvents.length > 0) ? (
                <div className='flex gap-mediums items-center'>
                    <Icon name='star' size='xlarge' className='text-muted' />
                    <div>
                        <Heading className='fw-bold'>{todayEvents[0].name}</Heading>
                        <Heading className='text-muted'>is Happening!</Heading>
                    </div>
                </div>
            ) : (
                <div className='flex gap-large items-center'>
                </div>
            )}
        </div>
    );
}

export default EventDisplay;
