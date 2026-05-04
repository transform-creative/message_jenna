
import Select, {
  InputActionMeta,
} from "react-select";
import Creatable from "react-select/creatable";

const colorStyles = {
  control: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles
  ) => ({
    ...baseStyles,
    boxShadow: isFocused
      ? "0 0 0 2px var(--accent) inset"
      : "none",
    border:
      "1px solid var(--accent-lg) !important",
    fontSize: "10pt",
    borderRadius: "var(--border)",
    height: "3em",
    width: "100%",
    textIndent: "10px",
    color: "var(--txt)",
    backgroundColor: isFocused
      ? "var(--accent-sm)"
      : "var(--bg)",
  }),
  placeholder: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles
  ) => ({
    gridArea: "1 / 1 / 1 / 1",
    display: "flex",
    color: "var(--accent-md)",
    padding: "0",
  }),

  singleValue: (baseStyles: any) => ({
    ...baseStyles,
    borderWidth: 0,
    fontSize: "10pt",
    padding: "0 0",
    margin: 0,
    borderRadius: "var(--border)",
    lineHeight: 2,
    textIndent: "10px",
    color: "var(--txt)",
    display: "flex",
    justifyContent: "start",
  }),

  valueContainer: (baseStyles: any) => ({
    ...baseStyles,
    borderWidth: 0,
    padding: 0,

    margin: 0,
    fontSize: "10pt",
    borderRadius: "var(--border)",
    color: "var(--txt)",
  }),

  input: (baseStyles: any) => ({
    ...baseStyles,
    color: "var(--txt)",
    margin: 0,
    padding: 0,
  }),

  menu: (baseStyles: any) => ({
    ...baseStyles,
    backgroundColor: "var(--accent-sm)",
    margin: 0,
    fontSize: "10pt",
  }),

  option: (
    baseStyles: any,
    {
      isDisabled,
      isFocused,
      isSelected,
    }: InputStyles
  ) => ({
    ...baseStyles,
    borderRadius: "var(--border)",
    fontSize: "10pt",
    padding: "15px 10px",
    display: "flex",
    justifyContent: "start",
    alignItems: "center",
    boxShadow: isFocused
      ? "0 0 0 1px var(--accent-lg) inset"
      : "none",

    color: isDisabled
      ? undefined
      : isSelected
      ? "var(--txt)"
      : isFocused
      ? "var(--txt)"
      : undefined,
    backgroundColor: isDisabled
      ? undefined
      : isSelected
      ? "var(--accent)"
      : isFocused
      ? undefined
      : undefined,
  }),
};

interface SelectableInputProps {
  id?: string;
  className?: string;
  options: any[];
  value: any;
  defaultValue?: string;
  onChange: (val: any) => void;
  onInputChange: (
    val: string,
    meta: InputActionMeta
  ) => void;
  disabled?: boolean;
  placeholder: string;
  width?: number;
}

interface InputStyles {
  isDisabled: boolean;
  isFocused: boolean;
  isSelected: boolean;
}

export default function TypeInput({
  id,
  className,
  options,
  defaultValue,
  value,
  onInputChange,
  onChange,
  disabled = false,
  placeholder = "select...",
  width = 150,
}: SelectableInputProps) {
  if (disabled) {
    return (
      <div className={className} id={id}>
        <input
          disabled
          value={defaultValue}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      id={id}
    >
      <Select
        options={options}
        onChange={(v) =>
          onChange((v as any).value)
        }
        onInputChange={(val, meta) =>
          onInputChange(val, meta)
        }
        isDisabled={disabled}
        components={{
          IndicatorSeparator: () => null,
        }}
        placeholder={placeholder}
        defaultInputValue={defaultValue || ""}
        /*@ts-ignore*/
        styles={colorStyles}
      />
    </div>
  );
}

interface CreatableTypeInputProps {
  id?: string;
  className?: string;
  options: any[];
  value: any;
  defaultValue?: string;
  onChange: (val: any) => void;
  onInputChange: (
    val: string,
    meta: InputActionMeta
  ) => void;
  disabled?: boolean;
  placeholder: string;
  onCreate: (val: any) => void;
  width?: number;
}

export function CreatableTypeInput({
  id,
  className,
  options,
  value,
  defaultValue,
  onChange,
  onInputChange,
  disabled = false,
  placeholder = "select...",
  onCreate,
  width = 150,
}: CreatableTypeInputProps) {
  if (disabled) {
    return (
      <div className={className} id={id}>
        <input
          disabled
          value={defaultValue}
          onChange={onChange}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      id={id}
      style={{ minWidth: width }}
    >
      <Creatable
        options={options}
        inputValue={value}
        value={value}
        onChange={(val) => onChange(val)}
        onInputChange={(val, meta) =>
          onInputChange(val, meta)
        }
        onCreateOption={(val) => onCreate(val)}
        isDisabled={disabled}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        placeholder={placeholder}
        defaultInputValue={defaultValue || ""}
        /*@ts-ignore*/
        styles={colorStyles}
      />
    </div>
  );
}
