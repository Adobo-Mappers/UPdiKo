import { useEffect, useState } from 'react';
import customEvents from './custom-events.json';

const MANILA_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function EventDisplay() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setCurrentDate(MANILA_FORMATTER.format(new Date()));

    const loadEvents = async () => {
      try {
        const response = await fetch('https://date.nager.at/api/v3/PublicHolidays/2026/ph', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch holidays');
        }

        const holidays = await response.json();
        setEvents([
          ...customEvents,
          ...holidays.map((event) => ({ date: event.date, name: event.name })),
        ]);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching events:', error);
          setEvents(customEvents);
        }
      }
    };

    loadEvents();

    return () => controller.abort();
  }, []);

  const todayEvents = events.filter((event) => event.date === currentDate);

  return (
    <section className="event-display">
      {todayEvents.map((event) => (
        <div key={`${event.date}-${event.name}`} className="event-chip">
          {event.name}
        </div>
      ))}
    </section>
  );
}

export default EventDisplay;
