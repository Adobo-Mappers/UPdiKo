import Title from "../../components/texts/Title/Title";
import Heading from "../../components/texts/Heading/Heading";
import Text from "../../components/texts/Text/Text";
import Caption from "../../components/texts/Caption/Caption";
import Emphasis from "../../components/texts/Emphasis/Emphasis";

export default function ServicesPage() {
    return (
        <div className="services-page">
            <Title>Services Page</Title>
            <Heading>Services</Heading>
            <Text>Normal text <Emphasis weight="bold">it seems...</Emphasis></Text>
            <Caption>Little caption here</Caption>
        </div>
    );
}