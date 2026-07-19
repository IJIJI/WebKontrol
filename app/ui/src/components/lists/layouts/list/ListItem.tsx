import { JSX } from "react/jsx-runtime";

import "../../listLayout.less";
import { ListItemType } from "../../types";

export interface ListItemProps {
  type: ListItemType;
  className: string;
}

export function ListItem(props: ListItemProps): JSX.Element {
  return (
    <div className={["listItem", props.type, props.className].join(" ")}>
      
    </div>
  );
}