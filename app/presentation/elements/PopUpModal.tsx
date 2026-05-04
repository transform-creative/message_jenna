import IonIcon from "@reacticons/ionicons";

import gsap from "gsap";
import { Transition } from "react-transition-group";
import { useRef } from "react";
import type { IoniconName } from "~/data/Ionicons";
import type { ActivatableElement } from "~/data/CommonTypes";

interface PopUpModalProps extends ActivatableElement {
  children: any;
  width: number | string;
  icon?: {
    name: IoniconName;
    color?: string;
    size: number;
  };
  zIndex?: number;
  disableClickOff?: boolean;
}

export default function PopUpModal({
  active,
  onClose,
  children,
  width,
  icon,
  zIndex = 20,
  disableClickOff = false,
}: PopUpModalProps) {
  const transitionRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    gsap.from(transitionRef?.current, {
      alpha: 0,
      rotate: 20,
      duration: 0.5,
      y: -300,
      ease: "back.inOut",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      y: 300,
      duration: 0.5,
      rotate: 20,
      ease: "back.inOut",
    });
  };

  return (
    <div>
      {active && (
        <div className="modal-bkg fade-sm" />
      )}
      <Transition
        nodeRef={transitionRef}
        in={active}
        timeout={300}
        onEnter={handleEnter}
        onExit={handleExit}
        unmountOnExit
      >
        <div
          ref={transitionRef}
          style={{ zIndex: zIndex }}
          className="fill-screen center middle"
          onClick={() => {
            if (!disableClickOff) onClose();
          }}
        >
          <div
            className="menu s2 p-5 outline"
            style={{
              width: width,
              height: "auto",
            }}
          >
            <div onClick={() => onClose()} className="rightRow m0">
              <IonIcon
                className="buttonIcon clickable"
                name="close"
              />
            </div>
            <div style={{ padding: 10 }}>
              {icon && (
                <div className="center">
                  <IonIcon
                    style={{
                      width: icon.size,
                      height: icon.size,
                      color: icon.color || "red",
                    }}
                    name={icon.name}
                  />
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
