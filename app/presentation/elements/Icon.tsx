import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import IonIcon from "@reacticons/ionicons";
import { IoniconName } from "~/data/Ionicons";
import "./LabelInput/LabelInput.css"

export interface IconProps {
  name: IoniconName;
  size?: number;
  color?:string;
  onClick?: () => void;
  className?: string;
}

/******************************
 * Icon component
 * @todo Create description
 */
export function Icon({
  name,
  color="var(--txt)",
  className = "",
  size = 12,
  onClick
}: IconProps) {
  const context: SharedContextProps = useOutletContext();

  return (
    <div>
      <IonIcon
      onClick={() => onClick && onClick()}
        name={name}
        className={`${onClick && "clickable"} ${className}`}
        style={{
          height: `${size}pt`,
          width: `${size}pt`,
          display: "flex",
          color: color
        }}
      />
    </div>
  );
}
