import { NavLink } from "react-router-dom";
import { type JSX } from "react/jsx-runtime";

export default function OverviewPage(): JSX.Element {
  return (
    <>
      <NavLink to={"/puppets/1"} state={{ back: { path: "/", label: "Home" } }}>
        Puppet 1
      </NavLink>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
      <h1>Test!</h1>
    </>
  );
}
