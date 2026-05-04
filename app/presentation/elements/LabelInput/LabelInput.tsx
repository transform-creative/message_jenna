import {
  CSSProperties,
  HTMLInputAutoCompleteAttribute,
  Ref,
  useRef,
  useState,
} from "react";
import { InputOption } from "~/data/CommonTypes";
import TypeInput from "../TypeInput";

interface LabelInputProps {
  id?: string;
  type?: string;
  placeholder?: string;
  error?: string | undefined;
  name: string;
  value: any;
  className?: string;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  autoFocus?: boolean;
  disabled?: boolean;
  isTextArea?: boolean;
  style?: CSSProperties;
  options?: InputOption[];
  inlineLabel?: boolean;
  onChange: (newValue: React.ChangeEvent<any>) => void;
}

export default function LabelInput({
  id = "",
  name,
  value,
  error,
  placeholder,
  type,
  className,
  autoComplete,
  autoFocus,
  disabled,
  isTextArea = false,
  options,
  inlineLabel = false,
  style,
  onChange,
}: LabelInputProps) {
  const [selected, setSelected] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(
    null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleFocus() {
    if (inputRef.current?.disabled) return;

    setSelected(true);
    inputRef.current?.focus();
  }

  function handleBlur() {
    setSelected(false);
    wrapperRef.current?.blur();
  }

  return (
    <div className="w-100">
      <div
        className={`labelInput fade-sm  ${
          selected && "labelInputSelected"
        } ${className}`}
        onClick={() => handleFocus()}
        role={disabled ? "disabled" : "none"}
      >
        {!inlineLabel && (
          <div className="mt-5">
            <label
              className="ml-10 bold"
              htmlFor={id || name}
              style={{
                color: `${error ? "var(--danger)" : "var(--txt)"}`,
              }}
            >
              {name}
            </label>
          </div>
        )}
        <div className="row ">
          <div className="w-100 row pr-10 middle">
            {inlineLabel && <h3 className="ml-10">{name}</h3>}
            {isTextArea ? (
              <textarea
                ref={inputRef as Ref<HTMLTextAreaElement>}
                id={id || name}
                name={name}
                className="p-10 m0 w-100"
                placeholder={placeholder || ""}
                role="labelInput"
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                value={value}
                onChange={onChange}
                onBlur={() => handleBlur()}
                style={{
                  ...style,
                  color: `${error ? "var(--danger)" : "var(--txt)"}`,
                  border: "none",
                  background: "none",
                }}
              />
            ) : options ? (
              <TypeInput
                id={id || name}
                value={value}
                /**@ts-ignore */
                onChange={(val) => onChange(val)}
                onInputChange={(val) => {}}
                options={options}
                className="w-100"
                placeholder={placeholder || ""}
              />
            ) : (
              <input
                id={id || name}
                name={name}
                ref={inputRef as Ref<HTMLInputElement>}
                className="p0 m0 w-100"
                placeholder={placeholder || ""}
                role="labelInput"
                type={type || "text"}
                autoComplete={autoComplete}
                disabled={disabled}
                autoFocus={autoFocus}
                value={value}
                onChange={(e) => onChange(e)}
                onBlur={() => handleBlur()}
                style={{
                  ...style,
                  color: `${error ? "var(--danger)" : "var(--txt)"}`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
