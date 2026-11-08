import { useEffect, useRef, type ReactNode } from "react";
import { X, Flower2, ArrowUpRight } from "lucide-react";
import { apparatusLabels, phaseLabels, type Exercise } from "../domain/model";

export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-label={title}
    >
      <div className="modal-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        <button className="icon-button" aria-label="Zamknij" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Empty({
  title,
  text,
  action,
  label,
}: {
  title: string;
  text: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Flower2 size={30} strokeWidth={1.2} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button secondary" onClick={action}>
          {label}
          <ArrowUpRight size={16} />
        </button>
      )}
    </div>
  );
}

export function Tags({ exercise }: { exercise: Exercise }) {
  return (
    <div className="tags">
      <span className={`tag ${exercise.apparatus}`}>
        {apparatusLabels[exercise.apparatus]}
      </span>
      <span className="tag">{exercise.level}</span>
      <span className="tag">{phaseLabels[exercise.phase]}</span>
    </div>
  );
}

// Decorative, code-native illustration; deliberately not an anatomical demonstration.
export function MovementArt({
  kind = "mat",
  variant = 0,
  large = false,
}: {
  kind?: string;
  variant?: number;
  large?: boolean;
}) {
  return (
    <div
      className={`movement-art art-${kind} ${large ? "large-art" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 190" fill="none">
        <circle cx="275" cy="50" r="66" fill="currentColor" opacity=".06" />
        <path
          d="M40 157H320"
          stroke="currentColor"
          opacity=".25"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {kind === "reformer" ? (
          <>
            <path
              d="M64 148H286L298 163H49L64 148Z"
              fill="currentColor"
              opacity=".12"
            />
            <path
              d="M78 148V165M273 148V165M279 147V116"
              stroke="currentColor"
              strokeWidth="5"
            />
            <rect
              x="87"
              y="138"
              width="125"
              height="10"
              rx="5"
              fill="currentColor"
              opacity=".4"
            />
            <path
              d="M115 128L162 117L202 128L254 113"
              stroke="currentColor"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="97" cy="125" r="12" fill="currentColor" />
            <path
              d="M151 120L137 143M201 128L238 143"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        ) : kind === "tower" ? (
          <>
            <path
              d="M75 157V28H287V157M75 55H287"
              stroke="currentColor"
              strokeWidth="4"
              opacity=".45"
            />
            <path
              d="M124 55L150 102M242 55L220 102"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <circle cx="180" cy="72" r="13" fill="currentColor" />
            <path
              d="M180 94V127M180 100L149 103M180 100L220 103M180 126L150 153M180 126L213 153"
              stroke="currentColor"
              strokeWidth="11"
              strokeLinecap="round"
            />
          </>
        ) : variant % 3 === 0 ? (
          <>
            <circle cx="100" cy="127" r="13" fill="currentColor" />
            <path
              d="M122 137L168 111L220 119L254 146"
              stroke="currentColor"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M139 129L166 148M218 119L241 85"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M241 85L279 65"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </>
        ) : variant % 3 === 1 ? (
          <>
            <circle cx="141" cy="49" r="13" fill="currentColor" />
            <path
              d="M155 70L189 116L230 151M189 116L143 151"
              stroke="currentColor"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M159 80L111 81L82 53M161 81L201 71L222 38"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <circle cx="106" cy="107" r="13" fill="currentColor" />
            <path
              d="M126 108L178 115L215 76L259 77"
              stroke="currentColor"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M142 111L137 146M176 117L197 148M214 77L205 41"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
}
