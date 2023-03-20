import classNames from "classnames";
import { useEffect, useState } from "react";
import "./Toggle.scss";

export default function Toggle({ text, isSelected, className, onClick, ...rest }) {
  return (
    <div onClick={onClick} className={classNames(className, "Toggle", { selected: isSelected })} {...rest}>
      {text}
    </div>
  );
}
