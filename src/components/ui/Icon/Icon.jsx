import "./Icon.css";

export default function Icon({ src , alt="alt-text"}) {
    return (
        <img className="icon" src={src} alt={alt} />
    );
}