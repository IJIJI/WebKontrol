import { NavLink } from "react-router-dom";
import ContentSection from "../components/layout/content/ContentSection";


export default function OverviewPage() {

  return (
    <ContentSection>
      <NavLink to={"/puppets/1"} state={{ back: {path: "/", label: "Home"}}}>
        Puppet 1
      </NavLink>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
    </ContentSection>
  );
}