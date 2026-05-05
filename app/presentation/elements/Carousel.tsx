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
  showDots?: "start" | "end";
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
  mode?: 'slide' | 'fade';
}

export function Carousel({
  showArrows = false,
  showDots,
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
  mode = 'slide',
}: ResourceLaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(
    startIndex < 0 ? 0 : startIndex,
  );
  const selectedIndexRef = useRef(startIndex < 0 ? 0 : startIndex);
  const items = Children.toArray(children);
  const useInfiniteLoop = mode !== 'fade' && loop && items.length > 1;
  // Clone a fixed number of items on each side — enough for the centering
  // offset to stay positive without tripling the entire array.
  const clonesPerSide = useInfiniteLoop ? Math.min(items.length, 5) : 0;
  const domItems = useInfiniteLoop
    ? [...items.slice(-clonesPerSide), ...items, ...items.slice(0, clonesPerSide)]
    : items;
  const domCount = domItems.length;           // N + 2*clonesPerSide when looping, else N
  const cloneOffset = clonesPerSide;          // real items start at this DOM index
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moveAmount = autoplay === true ? 50 : 100;
  const pauseRef = useRef(false);
  const stoppedRef = useRef(false);

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
    requestAnimationFrame(() => {
      // Instantly position to starting index — no entry animation
      if (mode !== 'fade' && trackRef.current) {
        const safeStart = Math.max(0, startIndex);
        gsap.set(trackRef.current, {
          x: 0,
          xPercent: -centeredPercent(safeStart + cloneOffset) * 100,
        });
      }
      if (mode === 'fade') {
        itemRefs.current.forEach((el, i) => {
          if (el) gsap.set(el, { opacity: i === startIndex ? 1 : 0 });
        });
      }
    });

    // Controls the loop if autoplaying

    const shouldAutoPlay =
      autoplay === true &&
      (mode === 'fade' ? items.length > 1 : carouselExtendsScreen() === true);

    if (shouldAutoPlay !== true) return;

    const int = setInterval(() => {
      if (pauseRef.current === true || stoppedRef.current === true) return;

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

      if (mode !== 'fade') {
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
            stoppedRef.current = true;
            onDragEnd && onDragEnd();
          },
        });
      }

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
      const itemWidth = track.width / domCount;
      const centerOffset = container.width / 2 - itemWidth / 2;
      return Math.round(
        ((scrolled + centerOffset) / track.width) * domCount +
          snapOffset / 100,
      ) - cloneOffset;
    }
    const xPercent = scrolled / track.width;
    return Math.round(domCount * xPercent + snapOffset / 100) - cloneOffset;
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
   * Returns the xPercent fraction (0–1) for a given DOM index,
   * applying the centering offset and clamping when centerFocused is on.
   */
  function centeredPercent(domIndex: number): number {
    const raw = domIndex / domCount;
    if (!centerFocused) return raw;
    const tw = trackRef.current?.getBoundingClientRect().width || 0;
    const cw = containerRef.current?.getBoundingClientRect().width || 0;
    if (!tw) return raw;
    const itemW = tw / domCount;
    const offset = (cw / 2 - itemW / 2) / tw;
    const max = (tw - cw) / tw;
    return Math.max(0, Math.min(raw - offset, max));
  }

  /***************************************
   * Scroll to a spefic element on the carousel
   */
  function scrollToIndex(index: number) {
    if (mode === 'fade') {
      if (loop === false) index = Math.max(0, Math.min(index, items.length - 1));
      else if (index < 0) index = items.length - 1;
      else if (index >= items.length) index = 0;

      const prevEl = itemRefs.current[selectedIndexRef.current];
      const nextEl = itemRefs.current[index];
      if (prevEl && prevEl !== nextEl) gsap.to(prevEl, { opacity: 0, duration: speed });
      if (nextEl) gsap.to(nextEl, { opacity: 1, duration: speed });

      setSelectedIndex(index);
      selectedIndexRef.current = index;
      return;
    }

    // Infinite clone-based loop
    if (useInfiniteLoop) {
      if (index < 0 || index >= items.length) {
        // Wrap to [0, N-1] — works for any distance into clone territory
        const normalized = ((index % items.length) + items.length) % items.length;
        const realDomIndex = cloneOffset + normalized;
        const cloneDomIndex = cloneOffset + index; // the clone slot to animate through

        if (cloneDomIndex >= 0 && cloneDomIndex < domCount) {
          // Animate to the clone that mirrors the target, then silently jump to the real item
          const tl = gsap.timeline();
          tl.to(trackRef.current, {
            x: 0,
            xPercent: -centeredPercent(cloneDomIndex) * 100,
            duration: speed,
            ease: "power2.out",
          }).set(trackRef.current, {
            x: 0,
            xPercent: -centeredPercent(realDomIndex) * 100,
          });
        } else {
          // Dragged so far that no clone exists at that depth — teleport directly
          gsap.set(trackRef.current, { x: 0, xPercent: -centeredPercent(realDomIndex) * 100 });
        }

        setSelectedIndex(normalized);
        selectedIndexRef.current = normalized;
        return;
      }
      // Normal navigation within real items (middle third of DOM)
      gsap.to(trackRef.current, {
        x: 0,
        xPercent: -centeredPercent(index + cloneOffset) * 100,
        duration: speed,
        ease: "back.out",
      });
      setSelectedIndex(index);
      selectedIndexRef.current = index;
      return;
    }

    // Non-loop slide mode
    if (index < 0 && loop === false) index = 0;

    let percent = index * (1 / items.length);

    const trackWidth =
      trackRef.current?.getBoundingClientRect().width || 0;
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width || 0;
    const isPastEnd =
      trackWidth - trackWidth * percent < containerWidth;

    if (trackWidth < containerWidth) {
      percent = 0;
      index = 0;
    } else if (isPastEnd) {
      if (index >= selectedIndex) {
        percent = (trackWidth - containerWidth) / trackWidth;
        index = items.length - 1;
      } else if (index < selectedIndex && loop === false) {
        percent = 0;
        index = 0;
      }
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

    gsap.to(trackRef.current, {
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
        overflowY: "clip",
      }}
    >
      
      {showDots=="start" && items.length > 1 && (
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
              onClick={() => { stoppedRef.current = false; scrollToIndex(i); }}
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
              stoppedRef.current = false;
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
            width: mode === 'fade' ? "100%" : "max-content",
            position: mode === 'fade' ? "relative" : undefined,
            gap: fullScreen || mode === 'fade' ? "0px" : "10px",
            willChange: "transform",
            cursor: mode === 'fade' ? "default" : "grab",
          }}
        >
          {[...domItems].map((child, i) => {
            const logicalIndex = i - cloneOffset;
            const isSelected = selectedIndex === logicalIndex;
            const isClone = useInfiniteLoop && (i < cloneOffset || i >= cloneOffset + items.length);
            return (
              <div
                key={i}
                ref={(el) => { if (!isClone) itemRefs.current[logicalIndex] = el; }}
                onClick={() => { if (!isClone) { stoppedRef.current = true; onClick && onClick(child); } }}
                style={{
                  userSelect: "none",
                  zIndex: isSelected ? 1 : 0,
                  ...(mode === 'fade' ? {
                    position: isSelected ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    opacity: logicalIndex === startIndex ? 1 : 0,
                  } : {}),
                }}
              >
                {child}
              </div>
            );
          })}
        </div>

        {showArrows &&
          (loop || selectedIndex !== items.length - 1) && (
            <button
              onClick={() => { stoppedRef.current = false; scrollToIndex(selectedIndex + 1); }}
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

      {showDots=="end" && items.length > 1 && (
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
              onClick={() => { stoppedRef.current = false; scrollToIndex(i); }}
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
