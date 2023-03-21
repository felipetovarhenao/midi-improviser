import { useState } from "react";
import { Icon } from "@iconify/react";
import "./HelpBox.scss";
import classNames from "classnames";

export default function HelpBox({ icon = "material-symbols:help", children, className, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={classNames(className, "help-box")} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} {...rest}>
      <Icon icon={icon} className="icon" />
      {isOpen && <div className="help-box-inner">{children}</div>}
    </div>
  );
}
