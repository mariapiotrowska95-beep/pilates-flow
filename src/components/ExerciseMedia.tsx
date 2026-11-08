import { useState } from "react";
import type { Exercise } from "../domain/model";
export function ExercisePhoto({ exercise }: { exercise: Exercise }) {
  const [failed, setFailed] = useState(false);
  const src =
    exercise.image ||
    (exercise.video
      ? `https://i.ytimg.com/vi/${exercise.video.id}/hqdefault.jpg`
      : "");
  return src && !failed ? (
    <img
      className="exercise-image"
      src={src}
      alt={
        exercise.image
          ? exercise.name
          : `Miniatura filmu: ${exercise.video?.title}`
      }
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="photo-placeholder">
      {exercise.apparatus === "reformer" ? "REFORMER" : "PILATES"}
      <span>Opis i wskazówki ruchu</span>
    </div>
  );
}
export function ExerciseVideo({ exercise }: { exercise: Exercise }) {
  const [playing, setPlaying] = useState(false);
  const video = exercise.video;
  if (!video) return null;
  const url = `https://www.youtube.com/watch?v=${video.id}&t=${video.start}s`;
  return (
    <section className="exercise-video">
      <h3>Zobacz wykonanie</h3>
      {playing ? (
        <iframe
          title={`Instrukcja: ${exercise.name}`}
          src={`https://www.youtube-nocookie.com/embed/${video.id}?start=${video.start}&rel=0`}
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button className="video-launch" onClick={() => setPlaying(true)}>
          <ExercisePhoto exercise={exercise} />
          <span>▶ Odtwórz instrukcję YouTube</span>
        </button>
      )}
      <p>
        {video.channel} · {video.title}
        {video.start > 0
          ? ` · od ${Math.floor(video.start / 60)}:${String(video.start % 60).padStart(2, "0")}`
          : ""}
      </p>
      <a href={url} target="_blank" rel="noopener noreferrer">
        Otwórz film na YouTube ↗
      </a>
      <small>
        Film wymaga internetu. Jeśli autor wyłączył osadzanie, otwórz go na
        YouTube. Miniatura przedstawia film, niekoniecznie ten fragment.
      </small>
    </section>
  );
}
