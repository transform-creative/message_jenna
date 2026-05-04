import IonIcon from "@reacticons/ionicons";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import type { ActivatableElement, ContextModalElement } from "~/data/CommonTypes";

interface ContextModalProps extends ContextModalElement {
  x: number;
  y: number;
  z?: number;
  children: any;
  width?: number | string;
  height?: number | string;
  onRight?: boolean;
  onTop?: boolean;
  noBlur?: boolean;
  autoHide?: boolean;
  onClose: () => void;
}

export default function ContextModal({
  x = 0,
  y = 0,
  z = 15,
  active,
  onClose,
  children,
  width = "auto",
  height = "auto",
  onRight = false,
  onTop = false,
  noBlur = false,
  autoHide = false,
}: ContextModalProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const screenHeight = window.innerHeight;

  const [customX, setCustomX] = useState(x);
  const [customY, setCustomY] = useState(y);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    const heightOfClient = menuRef.current?.clientHeight || 0;
    const widthOfClient = menuRef.current?.clientWidth || 0;
    setCustomX(x);
    setCustomY(y);

    // Center box if screen width is small
    if (
      screenWidth <
      widthOfClient + Math.round(widthOfClient / 1.5)
    ) {
      setCustomX(screenWidth / 2 - widthOfClient / 2 - 20);
    } else if (screenWidth - x < widthOfClient) {
      setCustomX(x - widthOfClient);
    }

    //Center box vertically if screen height is small
    if (screenHeight < heightOfClient + heightOfClient / 2) {
      setCustomY(screenHeight / 2 - heightOfClient / 2 - 20);
    } else if (screenHeight - y < heightOfClient) {
      setCustomY(y - heightOfClient);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [active]);

  /**********************
   * Handle when close is clicked
   * @param e
   * @param forceClose
   */
  function updateIsActive(
    e: React.MouseEvent<HTMLDivElement>,
    forceClose = false
  ) {
    if (
      /*@ts-ignore*/
      e.target.id == "close" ||
      (forceClose == true && autoHide == true)
    )
      onClose();
  }

  if (active) {
    return (
      <div
        id="close"
        className={`${
          !noBlur && "modal-bkg"
        } fade-sm`}
        onClick={(e) => updateIsActive(e, true)}
      >
        <div
          ref={menuRef}
          className="boxed outline p0"
          style={{
            width: width,
            height: height,
            marginLeft: customX,
            marginTop: customY,
            zIndex: z,
          }}
        >
          {autoHide && (
            <div className="boxed">
              <IonIcon
                className="buttonIcon"
                name="close"
                onClick={(e) => updateIsActive(e, true)}
              />
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }
};
