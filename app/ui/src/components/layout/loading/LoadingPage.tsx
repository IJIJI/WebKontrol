import type { JSX } from "react";
import { Icons } from "../../icons/Icons";

import "./loadingPage.less";


export function LoadingPage(props: {label?: string}): JSX.Element {
  const label = props.label ? props.label : "Loading..." ;

  return (
    <div className="loadingPage">
      <span className="icon"><Icons.loading size={80} /></span>
      <span className="label">{label}</span>
    </div>
  );
}