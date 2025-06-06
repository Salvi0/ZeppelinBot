import type { Knub } from "knub";

type Profiler = Knub["profiler"];
let profiler: Profiler | null = null;

export function getProfiler(): Profiler | null {
  return profiler;
}

export function setProfiler(_profiler: Profiler) {
  profiler = _profiler;
}
