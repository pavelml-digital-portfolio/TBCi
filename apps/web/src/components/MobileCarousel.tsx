import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Slide = { key: string; label: string; content: ReactNode };

/** One set of content: a desktop grid and a touch/keyboard carousel on phones. */
export default function MobileCarousel({
  label,
  items,
  className = "",
  trackClassName = "",
}: {
  label: string;
  items: Slide[];
  className?: string;
  trackClassName?: string;
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(false);
  const keys = items.map((i) => i.key).join("|");

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const media = matchMedia("(max-width: 767px)");
    const update = () => {
      setMobile(media.matches);
      const slides = Array.from(element.children) as HTMLElement[];
      if (!slides.length || !element.clientWidth) return;
      const start = slides[0].offsetLeft;
      const nearest = slides.reduce(
        (best, slide, i) =>
          Math.abs(slide.offsetLeft - start - element.scrollLeft) <
          Math.abs(slides[best].offsetLeft - start - element.scrollLeft)
            ? i
            : best,
        0,
      );
      setActive(nearest);
      element.style.setProperty(
        "--mobile-slide-height",
        slides[nearest].getBoundingClientRect().height + 4 + "px",
      );
    };
    element.scrollLeft = 0;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    Array.from(element.children).forEach((slide) => observer.observe(slide));
    element.addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", update);
      media.removeEventListener("change", update);
    };
  }, [keys]);

  const go = (index: number) => {
    const element = track.current;
    if (!element) return;
    const slides = Array.from(element.children) as HTMLElement[];
    const slide = slides[index];
    if (!slide) return;
    element.scrollTo({
      left: slide.offsetLeft - slides[0].offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <div
      className={"mobile-carousel " + className}
      role="region"
      aria-label={label}
      aria-roledescription={mobile ? "carousel" : undefined}
    >
      <div
        id={id}
        ref={track}
        className={"mobile-carousel-track " + trackClassName}
        tabIndex={mobile && items.length > 1 ? 0 : undefined}
        aria-label={
          mobile ? "Swipe or use arrow keys to browse " + label : undefined
        }
        onKeyDown={(e) => {
          if (!mobile || e.target !== e.currentTarget) return;
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            go(
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? items.length - 1
                  : Math.max(
                      0,
                      Math.min(
                        items.length - 1,
                        active + (e.key === "ArrowRight" ? 1 : -1),
                      ),
                    ),
            );
          }
        }}
      >
        {items.map((item, i) => (
          <div
            className="mobile-carousel-slide"
            key={item.key}
            role="group"
            aria-roledescription={mobile ? "slide" : undefined}
            aria-label={
              mobile ? `${i + 1} of ${items.length}: ${item.label}` : item.label
            }
          >
            {item.content}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mobile-carousel-controls">
          <div className="mobile-carousel-dots">
            {items.map((item, i) => (
              <button
                key={item.key}
                aria-label={`Slide ${i + 1}: ${item.label}`}
                aria-controls={id}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
              >
                <span />
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
