import IonIcon from "@reacticons/ionicons";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Transition, TransitionGroup } from "react-transition-group";
import type { ActivatableElement } from "~/data/CommonTypes";
import { Icon } from "./Icon";

interface SavedModalProps extends ActivatableElement {
  timeout?: number;
  header?: string;
  body?: string;
  state?: "success" | "fail";
}

export default function Alert({
  active,
  onClose,
  timeout = 5,
  header,
  body,
  state = "success",
}: SavedModalProps) {
  const timerExpiry: Date = new Date();
  timerExpiry.setSeconds(new Date().getSeconds() + timeout);
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active == true) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Update every 1 second

      // Cleanup function to clear the timeout if the component unmounts before 5 seconds
      return () => clearTimeout(timer);
    }
  }, [active]);

  const handleEnter = () => {
    gsap.to(transitionRef?.current, {
      alpha: 100,
      duration: 0.5,
      y: 300,
      ease: "elastic.inOut",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      y: -300,
      duration: 0.5,
      ease: "elastic.inOut",
    });
  };
  return (
    <Transition
      nodeRef={transitionRef}
      in={active}
      timeout={500}
      onEnter={handleEnter}
      onExit={handleExit}
      unmountOnExit
    >
      <div
        ref={transitionRef}
        className="boxed s1 m0 p0 outline"
        style={{
          background: ` ${
            state == "fail"
              ? "var(--dangerColor)"
              : "var(--accent)"
          }`,
          position: "fixed",
          zIndex: 100,
          height: "auto",
          width: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          top: -280,
        }}
      >
        <div className="row between middle p-5">
          <Icon
            className=""
            name={`${
              state == "success"
                ? "checkmark-circle-outline"
                : "close-circle-outline"
            }`}
            size={20}
            color={state == "fail" ? "var(--txt)" : "var(--txt)"}
          />

          <div>
            {header && (
              <h3
                style={{ color: "#111111" }}
                className="m-5 center"
              >
                {header}
              </h3>
            )}
            {body && (
              <p
                style={{ color: "#111111" }}
                className="m-5 center"
              >
                {body}
              </p>
            )}
          </div>

          <IonIcon
            className="buttonIcon m0"
            name="close"
            style={{
              color: "var(--txt)",
              right: 20,
              width: 15,
            }}
            onClick={() => onClose()}
          />
        </div>
      </div>
    </Transition>
  );
}
