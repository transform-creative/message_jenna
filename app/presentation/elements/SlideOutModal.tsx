import { useRef } from "react";
import * as spinners from "react-spinners";
import { Transition } from "react-transition-group";
import gsap from "gsap";
import type {
  ActivatableElement,
  SharedContextProps,
} from "~/data/CommonTypes";
import { Icon } from "./Icon";

interface SlideOutModalProps extends ActivatableElement {
  children: any;
  width: number | string;
  height?: number;
  style?: React.CSSProperties;
  isLoading?: boolean;
  context: SharedContextProps | undefined;
}

export default function SlideOutModal({
  active,
  onClose,
  children,
  width,
  height,
  style,
  context,
  isLoading = false,
}: SlideOutModalProps) {
  const transitionRef = useRef<HTMLDivElement>(null);

  function handleMainClick(e: any) {
    e.stopPropagation();
  }

  const handleEnter = () => {
    gsap.from(transitionRef?.current, {
      opacity: 0,
      x: 300,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  const handleExit = () => {
    gsap.to(transitionRef?.current, {
      opacity: 0,
      x: 300,
      duration: 0.5,
      ease: "power3.inOut",
    });
  };

  return (
    <div
      style={{ position: "relative", ...style, background: "red" }}
    >
      {active && <div className="modal-bkg fade-sm" />}
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
          className="fill-screen"
          onClick={() => onClose()}
        >
          {isLoading && (
            <spinners.HashLoader
              className=""
              style={{
                position: "fixed",
                left: "50%",
                top: "40%",
                zIndex: 15,
              }}
              color="var(--accent)"
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "end",
            }}
          >
            <div
              className=""
              style={{ margin: 0, padding: 0 }}
              onClick={(e) => handleMainClick(e)}
            >
              <div
                className="boxed p-10"
                style={{
                  minWidth: width,
                  maxWidth: width,
                  minHeight: height,
                  height: "100vh",
                  marginRight: context?.inShrink ? 0 : 15,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: context?.inShrink ? 10 : 20,
                  }}
                >
                  <Icon
                    name="close"
                    className="clickable"
                    onClick={onClose}
                  />
                </div>

                {children}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
