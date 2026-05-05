import { useState, useRef, useEffect } from "react";

interface FloatingImage {
  id: number;
  url: string;
  x: number; // percentage (for CSS)
  y: number; // percentage (for CSS)
  pxX: number; // pixels (for collision math)
  pxY: number; // pixels (for collision math)
  width: number; // pixels
  height: number; // pixels (estimated, updated on load)
  visible: boolean;
}

const PADDING = 16; // px gap required between images
const CENTER_PADDING = 24; // px gap required around center zone
const ASPECT_ESTIMATE = 1.25; // assumed h/w until image loads

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  pad: number
): boolean {
  return !(
    ax + aw + pad < bx ||
    bx + bw + pad < ax ||
    ay + ah + pad < by ||
    by + ah + pad < ay
  );
}

function findValidPosition(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
  centerRect: { x: number; y: number; w: number; h: number },
  existing: FloatingImage[]
): { pxX: number; pxY: number } | null {
  const maxX = Math.max(0, containerW - imgW);
  const maxY = Math.max(0, containerH - imgH);

  for (let attempt = 0; attempt < 50; attempt++) {
    const pxX = Math.random() * maxX;
    const pxY = Math.random() * maxY;

    // Check center zone collision
    if (
      rectsOverlap(
        pxX, pxY, imgW, imgH,
        centerRect.x, centerRect.y, centerRect.w, centerRect.h,
        CENTER_PADDING
      )
    ) {
      continue;
    }

    // Check collision with existing images
    const collides = existing.some((img) =>
      rectsOverlap(
        pxX, pxY, imgW, imgH,
        img.pxX, img.pxY, img.width, img.height,
        PADDING
      )
    );

    if (!collides) {
      return { pxX, pxY };
    }
  }

  return null; // Couldn't find a valid spot
}

export function JennaImages({ urls }: { urls: string[] }) {
  const [images, setImages] = useState<FloatingImage[]>([]);
  const imagesRef = useRef<FloatingImage[]>([]);
  const counterRef = useRef(0);
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (!urls.length) return;
    mountedRef.current = true;

    const trackTimeout = (id: ReturnType<typeof setTimeout>) => {
      timeoutsRef.current.add(id);
      return id;
    };

    function getCenterRect(containerW: number, containerH: number) {
      // Center zone: roughly 35% wide × 35% tall, centered
      const w = containerW * 0.35;
      const h = containerH * 0.35;
      return {
        x: (containerW - w) / 2,
        y: (containerH - h) / 2,
        w,
        h,
      };
    }

    function addImage() {
      if (!mountedRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      if (containerW === 0 || containerH === 0) return;

      const current = imagesRef.current;

      const usedUrls = new Set(current.map((img) => img.url));
      const available = urls.filter((url) => !usedUrls.has(url));
      const pool = available.length > 0 ? available : urls;
      const url = pool[Math.floor(Math.random() * pool.length)];

      const width = 250 + Math.random() * 200;
      const height = width * ASPECT_ESTIMATE;
      const centerRect = getCenterRect(containerW, containerH);

      const position = findValidPosition(
        containerW, containerH, width, height, centerRect, current
      );

      if (!position) {
        // Couldn't place — try again shortly
        const retryId = setTimeout(() => {
          timeoutsRef.current.delete(retryId);
          addImage();
        }, 1000);
        trackTimeout(retryId);
        return;
      }

      const { pxX, pxY } = position;
      const id = counterRef.current++;
      const newImg: FloatingImage = {
        id,
        url,
        pxX,
        pxY,
        x: (pxX / containerW) * 100,
        y: (pxY / containerH) * 100,
        width,
        height,
        visible: false,
      };

      imagesRef.current = [...current, newImg];
      setImages(imagesRef.current);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mountedRef.current) return;
          setImages((prev) => {
            const next = prev.map((img) =>
              img.id === id ? { ...img, visible: true } : img
            );
            imagesRef.current = next;
            return next;
          });
        });
      });

      const lifetime = 5000 + Math.random() * 5000;
      const fadeOutId = setTimeout(() => {
        timeoutsRef.current.delete(fadeOutId);
        if (!mountedRef.current) return;
        setImages((prev) => {
          const next = prev.map((img) =>
            img.id === id ? { ...img, visible: false } : img
          );
          imagesRef.current = next;
          return next;
        });
        const removeId = setTimeout(() => {
          timeoutsRef.current.delete(removeId);
          if (!mountedRef.current) return;
          setImages((prev) => {
            const next = prev.filter((img) => img.id !== id);
            imagesRef.current = next;
            return next;
          });
          addImage();
        }, 500);
        trackTimeout(removeId);
      }, lifetime);
      trackTimeout(fadeOutId);
    }

    // Update measured height once an image actually loads, so collision
    // checks for *future* images use real dimensions instead of the estimate.
    // (Existing placements stay put — we don't reflow what's already onscreen.)

    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const startId = setTimeout(() => {
        timeoutsRef.current.delete(startId);
        addImage();
      }, i * 800);
      trackTimeout(startId);
    }

    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current.clear();
    };
  }, [urls]);

  // Update real dimensions when images load
  const handleImageLoad = (id: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalRatio = img.naturalHeight / img.naturalWidth;
    setImages((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, height: item.width * naturalRatio } : item
      );
      imagesRef.current = next;
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: -2,
        opacity: 1,
      }}
    >
      {images.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt=""
          className="jenna-img"
          onLoad={(e) => handleImageLoad(img.id, e)}
          style={{
            position: "absolute",
            left: `${img.x}%`,
            top: `${img.y}%`,
            width: img.width,
            opacity: img.visible ? 1 : 0,
            transition: "opacity 0.5s",
          }}
        />
      ))}
    </div>
  );
}