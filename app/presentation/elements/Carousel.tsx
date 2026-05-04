import {
  useRef,
  Children,
  ReactNode,
  useState,
  useEffect,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "../elements/Icon";
import { Draggable, InertiaPlugin } from "gsap/all";
import { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";

// Register the plugin
gsap.registerPlugin(Draggable, InertiaPlugin);

export interface ResourceLaneProps {
  onClick?: (object: any) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showArrows?: boolean;
  showDots?: boolean;
  children: ReactNode;
  fullScreen?: boolean;
  speed?: number;
  interval: number;
  width?: number;
  autoplay?: boolean;
  loop?: boolean;
  startIndex?: number;
  resistance?: number;
  snapOffset?: number;
  centerFocused?: boolean;
}

export function Carousel({
  showArrows = false,
  showDots = false,
  children,
  onClick,
  onDragStart,
  onDragEnd,
  interval = 2,
  speed = 1,
  width = 100,
  fullScreen = false,
  autoplay = false,
  loop = true,
  startIndex = 0,
  resistance = 6000,
  snapOffset = 10,
  centerFocused = false,
}: ResourceLaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(
    startIndex < 0 ? 0 : startIndex,
  );
  const selectedIndexRef = useRef(startIndex < 0 ? 0 : startIndex);
  const items = Children.toArray(children);
  const moveAmount = autoplay === true ? 50 : 100;
  const pauseRef = useRef(false);

  /******************************
   * Control css for fullscreen mode
   */
  const breakoutStyles: React.CSSProperties = fullScreen
    ? {
        width: `${width}vw`,
        position: "relative",
        left: `${moveAmount}%`,
        right: `${moveAmount}%`,
        marginLeft: `-${Math.round(width / 2)}vw`,
        marginRight: `-${Math.round(width / 2)}vw`,
      }
    : {
        position: "relative",
        width: `${width}%`,
      };

  useEffect(() => {
    requestAnimationFrame(() => scrollToIndex(startIndex));

    // Controls the loop if autoplaying

    const shouldAutoPlay =
      autoplay === true && carouselExtendsScreen() === true;

    if (shouldAutoPlay !== true) return;

    const int = setInterval(() => {
      if (pauseRef.current === true) return;

      scrollToIndex(selectedIndexRef.current + 1);
    }, interval * 1000);

    return () => {
      clearInterval(int);
    };
  }, []);

  useGSAP(
    () => {
      // Cleanup + Set up
      const totalItems = items.length;
      if (totalItems === 0 || !trackRef.current) return;
      const existingDraggable = Draggable.get(trackRef.current);
      if (existingDraggable) existingDraggable.kill();

      // Kill the old timeline if it exists
      if (tweenRef.current) {
        tweenRef.current.kill();
        gsap.set(trackRef.current, {
          xPercent: 0,
          x: 0,
        });
      }

      Draggable.create(trackRef.current, {
        type: "x",
        inertia: true,
        throwResistance: resistance,
        onThrowUpdate: function () {
          if (isPastEnd() && this.tween?.timeScale() === 1)
            gsap.to(this.tween, {
              timeScale: 10,
              duration: 0.2,
            });
        },
        onThrowComplete: (e) => {
          scrollToIndex(getTargetIndex() || 0);
        },
        onRelease: function () {
          gsap.set(this.target, { zIndex: 1 });
        },
        onDragStart: (e) => {
          onDragStart && onDragStart();
        },
        onDrag: function () {},
        onDragEnd: () => {
          onDragEnd && onDragEnd();
        },
      });

      return () => {
        if (Draggable.get(trackRef.current))
          Draggable.get(trackRef.current).kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [items.length],
    },
  );

  /*********************************************
   * Get the current index closest to left of screen
   * based on the current x position
   */
  function getTargetIndex() {
    const track = trackRef.current?.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (!track || !container) return 0;
    const scrolled = container.x - track.x;
    if (centerFocused) {
      const itemWidth = track.width / items.length;
      const centerOffset = container.width / 2 - itemWidth / 2;
      return Math.round(
        ((scrolled + centerOffset) / track.width) * items.length +
          snapOffset / 100,
      );
    }
    const xPercent = scrolled / track.width;
    return Math.round(items.length * xPercent + snapOffset / 100);
  }

  /*********************************************
   * @returns True if the left edge has hit the left of screen or the right edge has hit the right wall
   */
  function isPastEnd() {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return;

    const trackWidth = track.width;
    const trackPostition = track.x;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width || 0;
    let isPastEnd = false;

    if (trackPostition > 0) isPastEnd = true;
    else if (
      trackWidth > containerWidth &&
      trackWidth - -trackPostition < containerWidth
    )
      isPastEnd = true;

    return isPastEnd;
  }

  /************************
   * @returns true if the track width is longer than the screen width
   */
  function carouselExtendsScreen() {
    const trackWidth =
      trackRef.current?.getBoundingClientRect().width;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width;

    if (trackWidth && containerWidth && trackWidth > containerWidth)
      return true;
    else return false;
  }

  /***************************************
   * Scroll to a spefic element on the carousel
   */
  function scrollToIndex(index: number) {
    if (index < 0 && loop === false) index = 0;

    let percent = index * (1 / items.length);

    const trackWidth =
      trackRef.current?.getBoundingClientRect().width || 0;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width || 0;
    const isPastEnd =
      trackWidth - trackWidth * percent < containerWidth;
    let loopTo: "start" | "end" | null = null;

    if (trackWidth < containerWidth) {
      percent = 0;
      index = 0;
    } else if (isPastEnd) {
      if (index >= selectedIndex) {
        if (loop === true && index > selectedIndex) {
          percent = 0;
          index = 0;
          loopTo = "start";
        } else {
          percent = (trackWidth - containerWidth) / trackWidth;
          index = items.length - 1;
        }
      } else if (index < selectedIndex && loop === false) {
        percent = 0;
        index = 0;
      }
    } else if (loop === true && index < 0) {
      index = items.length - 1;
      percent = index * (1 / items.length);
      loopTo = "end";
    }

    // Apply centering offset
    let finalPercent = percent;
    if (centerFocused && trackWidth > containerWidth) {
      const itemWidth = trackWidth / items.length;
      const centerOffsetPercent =
        (containerWidth / 2 - itemWidth / 2) / trackWidth;
      const maxPercent = (trackWidth - containerWidth) / trackWidth;
      finalPercent = Math.max(
        0,
        Math.min(percent - centerOffsetPercent, maxPercent),
      );
    }

    // Animate
    const tl = gsap.timeline();

    if (loopTo === "start") {
      tl.to(trackRef.current, {
        x: 0,
        xPercent: -100,
        duration: 0.3,
      }).to(trackRef.current, {
        x: 0,
        xPercent: 30,
        duration: 0,
      });
    } else if (loopTo === "end") {
      tl.to(trackRef.current, {
        x: 0,
        xPercent: 30,
        duration: 0.3,
      }).to(trackRef.current, {
        x: 0,
        xPercent: -100,
        duration: 0,
      });
    }

    tl.to(trackRef.current, {
      x: 0,
      xPercent: -finalPercent * 100,
      duration: speed,
      ease: "back.out",
    });

    setSelectedIndex(index);
    selectedIndexRef.current = index;
  }

  /*********************
   * Pause animation on mouse enter
   */
  const onMouseEnter = () => {
    pauseRef.current = true;
  };

  /*********************
   * Play animation on mouse enter
   */
  const onMouseLeave = () => {
    // Only resume if not currently being dragged
    if (!Draggable.get(trackRef.current)?.isDragging) {
      autoplay && carouselExtendsScreen() && tweenRef.current?.play();
    }
    pauseRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseEnter}
      onTouchEnd={onMouseLeave}
      style={{
        ...breakoutStyles,
        minHeight: "100px",
        overflowX: "hidden",
        overflowY: "visible",
      }}
    >
      
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {showArrows && (loop || selectedIndex !== 0) && (
          <button
            onClick={() => {
              scrollToIndex(selectedIndex - 1);
            }}
            className=""
            style={{
              background: "var(--accent-sm)",
              left: 10,
              zIndex: 10,
              position: "absolute",
            }}
          >
            <Icon name="caret-back" color="var(--accent-lg)" />
          </button>
        )}

        <div
          ref={trackRef}
          className="carousel-track"
          style={{
            display: "flex",
            width: "max-content",
            gap: fullScreen ? "0px" : "10px",
            willChange: "transform",
            cursor: "grab", // Visual hint for users
          }}
        >
          {[...items].map((child, i) => (
            <div
              key={i}
              className={`${selectedIndex === i && ""}`}
              onClick={() => onClick && onClick(child)}
              style={{
                userSelect: "none",
                zIndex: 1,
              }} // Prevent text selection while dragging
            >
              {child}
            </div>
          ))}
        </div>

        {showArrows &&
          (loop || selectedIndex !== items.length - 1) && (
            <button
              onClick={() => scrollToIndex(selectedIndex + 1)}
              style={{
                background: "var(--accent-sm)",
                right: 10,
                zIndex: 10,
                position: "absolute",
              }}
            >
              <Icon name="caret-forward" color="var(--accent-lg)" />
            </button>
          )}
          
      </div>

      {showDots && items.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            padding: "10px 0",
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              style={{
                width: 15,
                height: 15,
                borderRadius: "50%",
                background:
                  selectedIndex === i ? "var(--accent)" : "var(--accent-md)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "background 0.3s ease, transform 0.3s ease",
                transform: selectedIndex === i ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
