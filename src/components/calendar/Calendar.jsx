import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState, useEffect } from "react";
import { getPinnedLocationsFromDB, getCurrentUser } from "../../services/supabase"; // will add events to pinned locations later

const CalendarView = () => {
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
        const user = await getCurrentUser();
        if (user) {
            const locations = await getPinnedLocationsFromDB(user.id);
            const eventData = locations.map(loc => ({
            title: loc.locationName,
            start: new Date(), 
            end: new Date(),
            location: loc.address
            }));
            setEvents(eventData);
        }
        } catch (error) {
        console.error('Error loading events:', error);
        }
    };

    return (
        <div>
        <h2>Upcoming Events</h2>
        <Calendar 
            value={date}
            onChange={setDate}
        />
        {/* Display events list below calendar*/}
        <div className="events-list">
            {events.map(event => (
            <div key={event.id} className="event-item">
                <h3>{event.title}</h3>
                <p>{event.location}</p>
                <p>{event.start.toLocaleDateString()}</p>
            </div>
            ))}
        </div>
        </div>
    );
};

export default CalendarView;