interface BannerProps {
  top?: number;
  background?: string;
  children: any;
}

export default function Banner({
  top = 0,
  background = "var(--accent)",
  children,
}: BannerProps) {
  return (
    <div
      className="sticky p-10 middle center row"
      style={{ top: top, background: background }}
    >
      {children}
    </div>
  );
}
