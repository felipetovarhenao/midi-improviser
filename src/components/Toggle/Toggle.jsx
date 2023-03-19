import classNames from "classnames";
import { useEffect, useState } from "react";
import "./Toggle.scss";

export default function Toggle({ text, className, reset, onSelect, ...rest }) {
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    onSelect(selected);
  }, [selected]);

  useEffect(() => {
    setSelected(false);
  }, [reset]);

  return (
    <div onClick={() => setSelected((x) => !x)} className={classNames(className, "Toggle", { selected: selected })} {...rest}>
      {text}
    </div>
  );
}
