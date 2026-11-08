import { expect, it } from "vitest";
import videos from "./reformer-videos.json";
import { exerciseSchema, initialState, parseBackup } from "../domain/model";
it("adds exactly 30 valid reformer exercises including five warm-ups with YouTube chapters", () => {
  expect(videos).toHaveLength(30);
  expect(new Set(videos.map((v) => v.id)).size).toBe(30);
  expect(
    videos.filter((v) => v.phase === "warmup").length,
  ).toBeGreaterThanOrEqual(5);
  for (const exercise of videos) {
    expect(exerciseSchema.safeParse(exercise).success).toBe(true);
    expect(exercise.apparatus).toBe("reformer");
    expect(exercise.video.id).toMatch(/^[\w-]{11}$/);
  }
});
it("keeps old backups readable and retains videos in new backups", () => {
  expect(parseBackup(JSON.stringify(initialState())).schemaVersion).toBe(1);
  const state = initialState();
  state.customExercises = [exerciseSchema.parse(videos[0])];
  expect(parseBackup(JSON.stringify(state)).customExercises[0].video).toEqual(
    videos[0].video,
  );
  expect(
    exerciseSchema.safeParse({
      ...videos[0],
      video: { ...videos[0].video, id: "javascript:alert(1)" },
    }).success,
  ).toBe(false);
});
