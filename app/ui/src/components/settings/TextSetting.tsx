import { useRef } from "react";
import { JSX } from "react/jsx-runtime";


export function TextSetting({title, subtitle, value, setValue, disabled}: {title: string, subtitle: string, value: string, setValue: (value: string) => RTCEncodedVideoFrameMetadata, disabled?: boolean}): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="setting field" onClick={() => inputRef.current?.focus()}>
      <div className="title">
        <span className="title">{title}</span>
        <span className="subtitle">{subtitle}</span>
      </div>
      <div className="input">
        <input type="text" ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled} />
      </div>
    </div>
  );

}