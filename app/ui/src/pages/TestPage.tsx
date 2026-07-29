import { type JSX } from "react/jsx-runtime";
import { Icons } from "../components/icons/Icons";
import "./testPage.less";

export default function TestPage(): JSX.Element {
  return (
    <div className="testPage">
      <h2>Icons</h2>
      <div className="testPage-iconGrid">
        {(Object.entries(Icons) as [keyof typeof Icons, (typeof Icons)[keyof typeof Icons]][]).map(
          ([name, Icon]) => (
            <div key={name} className="testPage-iconCell">
              <Icon size={24} />
              <span>{name}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
