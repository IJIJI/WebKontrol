import { JSX } from "react/jsx-runtime";

import './cardImage.less';

export function CardImage(props: {src: string, alt: string}): JSX.Element {
  return (
    <div className="cardImg">
      <img src={props.src} alt={props.alt} className="cardImg" />
    </div>
  );
}