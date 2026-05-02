import './Footer.css';
import { NavLink } from "react-router-dom"
import { Icon } from "./../";
import { Caption } from "./../../typography";

export function Footer() {
    return (
    <footer>
        <nav>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Icon name="servicesNavlink" size="large"/>
                <Caption>Services</Caption>
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Icon name="mapNavlink" size="large"/>
                <Caption>Map</Caption>
            </NavLink>
            <NavLink to="/account" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Icon name="accountNavlink" size="large"/>
                <Caption>Account</Caption>
            </NavLink>
        </nav>
    </footer>
    );
}