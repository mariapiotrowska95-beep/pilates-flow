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
