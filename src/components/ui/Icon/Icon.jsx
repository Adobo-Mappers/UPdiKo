import "./Icon.css";

export default function Icon({ src , size="medium", alt="alt-text"}) {
    /**
     * Icon, duh!
     * 
     * Icon property types
     * src: path of the icon image
     * size: small, medium, or large
     */
    return (
        <img className={`icon ${size}`} src={src} alt={alt} />
    );
}