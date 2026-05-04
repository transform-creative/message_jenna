import IonIcon from "@reacticons/ionicons";
import type { IoniconName } from "~/data/Ionicons";

interface ErrorLabelProps {
  active: boolean;
  text?: string;
  color?: string;
  icon?: IoniconName
}

export default function ErrorLabel({
  active,
  text = "Please enter a valid value",
  color = "var(--dangerColor)",
  icon="alert-circle"
}: ErrorLabelProps) {
  if (active)
    return (
      <div className="mb-10">
        <div className="leftRow middle">
          <IonIcon
            name={icon}
            className="basicIcon mr-10"
            style={{ color: color }}
          />
          <label
            className="fade-sm m0"
            style={{ color: color }}
          >
            {text}
          </label>
        </div>
      </div>
    );
}
