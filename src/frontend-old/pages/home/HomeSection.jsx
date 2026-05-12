import './HomeSection.css';

import { useEffect, useState } from 'react';
import mascot from '../../assets/images/logo/logo.png';
import homeIcon from '../../assets/images/icon/home-icon.png';
import mapIcon from '../../assets/images/icon/map-pin-icon.png';
import accountIcon from '../../assets/images/icon/user-icon.png';
import searchIcon from '../../assets/images/icon/search-icon.png';
import EventDisplay from '../../components/events/EventDisplay.jsx';
import { usePublicLocations } from '../../hooks/useUnifiedLocations.js';
import { getCurrentUser } from '../../services/supabase.js';

<<<<<<< HEAD:src/frontend-old/pages/home/HomeSection.jsx
console.log(supabase);

function HomeSection({setAppSection, setAppService}) {
=======
function HomeSection({ setAppSection, setAppService }) {
  const [activeCategory, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const { data: allServices = [] } = usePublicLocations();
>>>>>>> feat/address-gaps:src/pages/home/HomeSection.jsx

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const tags = ['All', ...new Set(allServices.flatMap((service) => service.tags || []))];

  const filteredServices = allServices.filter((service) => {
    const name = (service.name || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase().trim());
    const matchesCategory =
      activeCategory === 'All' || (service.tags || []).includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="HomeSection">
      <EventDisplay />

      <header>
        <figure className="logo">
          <img src={mascot} alt="Logo Image" />
          <figcaption className="logo-name">UPdi Ko!</figcaption>
          <figcaption className="subheading">Buligan ta 'ka pangita!</figcaption>
        </figure>
      </header>

      <section className="search-section">
        <img src={searchIcon} className="icon" alt="" />
        <input
          className="search-bar"
          placeholder="Search for Services"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </section>

      <section className="service-section">
        <h1>Services</h1>
        <div className="categories">
          {tags.map((tag) => (
            <div
              key={tag}
              className={
                tag === activeCategory ? 'category-btn active-category btn' : 'category-btn btn'
              }
              onClick={() => setCategory(tag)}
            >
              {tag}
            </div>
          ))}
        </div>

        <div className="service-list" key={`${activeCategory}-${searchQuery}`}>
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="service-btn btn"
              onClick={() => setAppService(service)}
            >
              <img src={mapIcon} alt="" />
              <div>
                <h2 className="title">{service.name}</h2>
                <h3 className="tag">{(service.tags || []).join(', ')}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <nav>
          <ul>
            <li className="navigation active btn" onClick={() => setAppSection('HOME')}>
              <img className="icon" src={homeIcon} alt="" />
              <p className="label">Service</p>
            </li>
            <li className="navigation btn" onClick={() => setAppSection('MAP')}>
              <img className="icon" src={mapIcon} alt="" />
              <p className="label">Map</p>
            </li>
            <li className="navigation btn" onClick={() => setAppSection(user ? 'ACCOUNT' : 'LOGIN')}>
              <img className="icon" src={accountIcon} alt="" />
              <p className="label">Account</p>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  );
}

export default HomeSection;
