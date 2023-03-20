import "./Slider.scss";

function scaleValue(value, inMin = 0.0, inMax = 1.0, outMin = 0.0, outMax = 1.0) {
  const scaled = ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  return Math.round(scaled * 100) / 100;
}

export default function Slider({ name, value, setValue, inMin = 0, inMax = 100, outMin = 0.0, outMax = 1.0, step = 1, ...rest }) {
  return (
    <div className="Slider">
      <input className="slider" name={name} type="range" min={inMin} max={inMax} value={value} onChange={(e) => setValue(e.target.value)} step={step} {...rest} />
      <span className="value-display">{scaleValue(value, inMin, inMax, outMin, outMax)}</span>
    </div>
  );
}
