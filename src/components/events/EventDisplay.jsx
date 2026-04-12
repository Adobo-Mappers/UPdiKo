import customEvents from './custom-events.json';
import { useEffect, useState } from 'react';

export default function EventDisplay() {
    const [events, setEvents] = useState([]);
    useEffect(() => {
        async function fetchEvents () {
            try {
                const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/ph');
                const data = (await response.json()).map(event => ({ date: event.date, name: event.name }));
                const events = [...customEvents, ...data];
                setEvents(events);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        }
        fetchEvents();
    }, []);
    
    return (
        <div className='displayed-events'>
            { events.filter(event => event.date == new Date('2026-05-01').toISOString().split('T')[0]).map(event => (
                <div key={event.id} className='event-item'>
                    <h3>{event.name}</h3>   
                    <p>{event.date}</p>
                </div>
              )) 
            }
        </div>
    );

}