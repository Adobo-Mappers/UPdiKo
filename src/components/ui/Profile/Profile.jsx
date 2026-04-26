import "./Profile.css";

export default function Profile({ src , alt="alt-text"}) {
    return (
        <img className="profile" src={src} alt={alt} />
    );
}