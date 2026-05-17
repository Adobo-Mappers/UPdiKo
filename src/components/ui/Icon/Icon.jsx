import "./Icon.css";

import accommodationIcon from "../../../assets/images/icon/accommodation.png";
import communityIcon from "../../../assets/images/icon/community.png";
import financialIcon from "../../../assets/images/icon/financial.png";
import governmentIcon from "../../../assets/images/icon/government.png";
import groceryIcon from "../../../assets/images/icon/grocery.png";
import laundryIcon from "../../../assets/images/icon/laundry.png";
import medicalIcon from "../../../assets/images/icon/medical.png";
import restaurantIcon from "../../../assets/images/icon/restaurant.png";
import tourismIcon from "../../../assets/images/icon/tourism.png";
import universityIcon from "../../../assets/images/icon/university.png";
import accountNavlinkIcon from "../../../assets/images/icon/account-navlink-icon.png";
import addressIcon from "../../../assets/images/icon/address-icon.png";
import backIcon from "../../../assets/images/icon/back-icon.png";
import closeIcon from "../../../assets/images/icon/close-icon.png";
import compassIcon from "../../../assets/images/icon/compass-icon.png";
import darkstarIcon from "../../../assets/images/icon/darkstar-icon.png";
import deleteIcon from "../../../assets/images/icon/delete-icon.png";
import directionsIcon from "../../../assets/images/icon/directions-icon.png";
import editIcon from "../../../assets/images/icon/edit-icon.png";
import hidePasswordIcon from "../../../assets/images/icon/hide-password-icon.png";
import logoutIcon from "../../../assets/images/icon/logout-icon.png";
import mailIcon from "../../../assets/images/icon/mail-icon.png";
import mapIcon from "../../../assets/images/icon/maps-icon.png";
import mapNavlinkIcon from "../../../assets/images/icon/map-navlink-icon.png";
import openHoursIcon from "../../../assets/images/icon/open-hours-icon.png";
import passwordIcon from "../../../assets/images/icon/password-icon.png";
import phoneIcon from "../../../assets/images/icon/phone-icon.png";
import saveIcon from "../../../assets/images/icon/save-icon.png";
import savePng from "../../../assets/images/icon/save.png";
import searchIcon from "../../../assets/images/icon/search-icon.png";
import servicesNavlinkIcon from "../../../assets/images/icon/services-navlink-icon.png";
import showPasswordIcon from "../../../assets/images/icon/peeping-tom-icon.png";
import starIcon from "../../../assets/images/icon/star-icon.png";
import userIcon from "../../../assets/images/icon/user-icon.png";
import userImage from "../../../assets/images/icon/user.png";

export const iconMap = {
  accountNavlink: accountNavlinkIcon,
  mapNavlink: mapNavlinkIcon,
  servicesNavlink: servicesNavlinkIcon,

  address: addressIcon,
  back: backIcon,
  clock: openHoursIcon,
  close: closeIcon,
  compass: compassIcon,
  darkstar: darkstarIcon,
  delete: deleteIcon,
  direction: directionsIcon,
  edit: editIcon,
  eye: showPasswordIcon,
  hide: hidePasswordIcon,
  logout: logoutIcon,
  mail: mailIcon,  
  map: mapIcon,
  password: passwordIcon,
  phone: phoneIcon,
  save: saveIcon,
  search: searchIcon,
  star: starIcon,
  sunflower: userImage,
  user: userIcon,

  accommodation: accommodationIcon,
  community: communityIcon,
  education: universityIcon,
  finance: financialIcon,
  food: restaurantIcon,
  grid: mapIcon,
  health: medicalIcon,
  other: mapIcon,
  safety: governmentIcon,
  services: laundryIcon,
  shopping: groceryIcon,
  tourism: tourismIcon,
};

export function Icon({ name="", size="medium", alt="alt-text", className="", ...otherProps }) {
    /**
     * Icon property types
     * name: name of the icon (use keys from iconMap)
     * size: small, medium, or large
     * alt: alternative text for the icon
     * className: additional CSS classes for the icon
     */

    const iconSrc = iconMap[name] || name;

    return (
        <img className={`icon ${size} ${className}`} src={iconSrc} alt={alt} {...otherProps} />
    );
}
