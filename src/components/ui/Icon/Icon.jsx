import "./Icon.css";

import accommodationIcon   from "../../../assets/images/icon/accommodation.png";
import communityIcon       from "../../../assets/images/icon/community.png";
import financialIcon       from "../../../assets/images/icon/financial.png";
import governmentIcon      from "../../../assets/images/icon/government.png";
import groceryIcon         from "../../../assets/images/icon/grocery.png";
import laundryIcon         from "../../../assets/images/icon/laundry.png";
import medicalIcon         from "../../../assets/images/icon/medical.png";
import restaurantIcon      from "../../../assets/images/icon/restaurant.png";
import tourismIcon         from "../../../assets/images/icon/tourism.png";
import universityIcon      from "../../../assets/images/icon/university.png";
import accountNavlinkIcon  from "../../../assets/images/icon/account-navlink-icon.png";
import addressIcon         from "../../../assets/images/icon/address-icon.png";
import backIcon            from "../../../assets/images/icon/back-icon.png";
import closeIcon           from "../../../assets/images/icon/close-icon.png";
import compassIcon         from "../../../assets/images/icon/compass-icon.png";
import darkstarIcon        from "../../../assets/images/icon/darkstar-icon.png";
import deleteIcon          from "../../../assets/images/icon/delete-icon.png";
import directionsIcon      from "../../../assets/images/icon/directions-icon.png";
import editIcon            from "../../../assets/images/icon/edit-icon.png";
import hidePasswordIcon    from "../../../assets/images/icon/hide-password-icon.png";
import lightstarIcon       from "../../../assets/images/icon/lightstar-icon.png";
import logoutIcon          from "../../../assets/images/icon/logout-icon.png";
import mailIcon            from "../../../assets/images/icon/mail-icon.png";
import mapIcon             from "../../../assets/images/icon/maps-icon.png";
import mapNavlinkIcon      from "../../../assets/images/icon/map-navlink-icon.png";
import openHoursIcon       from "../../../assets/images/icon/open-hours-icon.png";
import passwordIcon        from "../../../assets/images/icon/password-icon.png";
import phoneIcon           from "../../../assets/images/icon/phone-icon.png";
import saveIcon            from "../../../assets/images/icon/save-icon.png";
import savePng             from "../../../assets/images/icon/save.png";
import searchIcon          from "../../../assets/images/icon/search-icon.png";
import servicesNavlinkIcon from "../../../assets/images/icon/services-navlink-icon.png";
import showPasswordIcon    from "../../../assets/images/icon/peeping-tom-icon.png";
import starIcon            from "../../../assets/images/icon/star-icon.png";
import userIcon            from "../../../assets/images/icon/user-icon.png";
import userImage           from "../../../assets/images/icon/user.png";
import frontIcon           from "../../../assets/images/icon/front-icon.png";
import sunnyIcon           from "../../../assets/images/icon/sunny-weather-icon.png";
import fairIcon            from "../../../assets/images/icon/partly-cloudy-icon.png";
import cloudyIcon          from "../../../assets/images/icon/cloudy-weather-icon.png";
import rainyIcon           from "../../../assets/images/icon/drizzle.png";
import stormyIcon          from "../../../assets/images/icon/rainy-icon.png";

// ── New map pin icons ────────────────────────────────────────────────────────
import bakeryIcon          from "../../../assets/images/icon/bakery.png";
import beautyIcon          from "../../../assets/images/icon/beauty.png";
import cafeIcon            from "../../../assets/images/icon/cafe.png";
import entertainmentIcon   from "../../../assets/images/icon/entertainment.png";
import funeralIcon         from "../../../assets/images/icon/funeral.png";
import giftIcon            from "../../../assets/images/icon/gift.png";
import hardwareIcon        from "../../../assets/images/icon/hardware.png";
import informationIcon     from "../../../assets/images/icon/information.png";
import lotteryIcon         from "../../../assets/images/icon/lottery.png";
import pharmacyIcon        from "../../../assets/images/icon/pharmacy.png";
import printingIcon        from "../../../assets/images/icon/printing.png";
import recyclingIcon       from "../../../assets/images/icon/recycling.png";
import religiousIcon       from "../../../assets/images/icon/religious.png";
import schoolsIcon         from "../../../assets/images/icon/schools.png";
import shelterIcon         from "../../../assets/images/icon/shelter.png";
import toiletIcon          from "../../../assets/images/icon/toilet.png";
import upvIcon             from "../../../assets/images/icon/upv.png";
import testPinIcon         from "../../../assets/images/icon/test_pin.png";
import testUpvIcon         from "../../../assets/images/icon/test_upv.png";
import testUserIcon        from "../../../assets/images/icon/test_user.png";

export const iconMap = {
  accountNavlink: accountNavlinkIcon,
  mapNavlink:     mapNavlinkIcon,
  servicesNavlink: servicesNavlinkIcon,

  address:   addressIcon,
  back:      backIcon,
  clock:     openHoursIcon,
  close:     closeIcon,
  compass:   compassIcon,
  darkstar:  darkstarIcon,
  delete:    deleteIcon,
  direction: directionsIcon,
  edit:      editIcon,
  eye:       showPasswordIcon,
  front:     frontIcon,
  hide:      hidePasswordIcon,
  lightstar: lightstarIcon,
  logout:    logoutIcon,
  mail:      mailIcon,
  map:       mapIcon,
  password:  passwordIcon,
  phone:     phoneIcon,
  save:      saveIcon,
  search:    searchIcon,
  star:      starIcon,
  sunflower: userImage,
  user:      userIcon,

  // ── Map pin categories (original) ───────────────────────────
  accommodation: accommodationIcon,
  community:     communityIcon,
  education:     universityIcon,
  finance:       financialIcon,
  food:          restaurantIcon,
  grid:          mapIcon,
  health:        medicalIcon,
  other:         mapIcon,
  safety:        governmentIcon,
  services:      laundryIcon,
  shopping:      groceryIcon,
  tourism:       tourismIcon,

  // ── Map pin categories (new) ─────────────────────────────────
  bakery:        bakeryIcon,
  beauty:        beautyIcon,
  cafe:          cafeIcon,
  entertainment: entertainmentIcon,
  funeral:       funeralIcon,
  gift:          giftIcon,
  hardware:      hardwareIcon,
  information:   informationIcon,
  lottery:       lotteryIcon,
  pharmacy:      pharmacyIcon,
  printing:      printingIcon,
  recycling:     recyclingIcon,
  religious:     religiousIcon,
  schools:       schoolsIcon,
  shelter:       shelterIcon,
  toilet:        toiletIcon,
  university:    universityIcon,
  upv:           upvIcon,
  test_pin:      testPinIcon,
  test_upv:      testUpvIcon,
  test_user:     testUserIcon,

  // ── Weather ──────────────────────────────────────────────────
  sunny:  sunnyIcon,
  fair:   fairIcon,
  cloudy: cloudyIcon,
  rainy:  rainyIcon,
  stormy: stormyIcon,
};

export function Icon({ name="", size="medium", alt="alt-text", className="", ...otherProps }) {
    /**
     * Icon property types
     * name: name of the icon (use keys from iconMap)
     * size: small, medium, large, or xlarge
     * alt: alternative text for the icon
     * className: additional CSS classes for the icon
     */

    const iconSrc = iconMap[name] || name;

    return (
        <img className={`icon ${size} ${className}`} src={iconSrc} alt={alt} {...otherProps} />
    );
}