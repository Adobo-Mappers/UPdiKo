import './Card.css';

import locationIcon from '../../../assets/images/icon/location-icon.png';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import Heading from '../../typography/Heading/Heading';
import Text from '../../typography/Text/Text';

export default function Card({children}) {
    return (
        <div className="card">
            {children}
        </div>
    );
}