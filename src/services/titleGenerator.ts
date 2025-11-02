type Exercise = {
  exerciseName: string;
  sets?: number;
  reps?: number;
  weight?: number;
  isBodyweight?: boolean;
};
type Workout = {
  createdAt: number | Date;
  exercises?: Exercise[];
  cardioSessions?: any[];
  title?: string;
};

const LIFTS = {
  squat: [/squat/],
  bench: [/bench( press)?/],
  deadlift: [/deadlift/],
};

const GROUPS: Record<string, RegExp[]> = {
  push: [/bench/, /press/, /overhead/, /dip/, /triceps?/, /chest/],
  pull: [/row/, /pull[- ]?up/, /lat/, /rear delt/, /biceps?/],
  legs: [/squat/, /deadlift/, /lunge/, /leg curl/, /leg extension/, /calf/],
  core: [/abs?/, /core/, /crunch/, /plank/, /hanging leg raise/],
  cardio: [
    /run/,
    /treadmill/,
    /bike|cycling/,
    /rower|rowing/,
    /elliptical/,
    /hiit/,
  ],
  mobility: [/mobility/, /stretch/, /foam roll/, /yoga/],
};

function normalize(s = "") {
  return s.toLowerCase().trim();
}

function dominantLift(exs: Exercise[]): string | null {
  const n = (name: string, re: RegExp[]) => re.some((r) => r.test(name));
  const counts = { squat: 0, bench: 0, deadlift: 0 };
  exs.forEach((e) => {
    const name = normalize(e.exerciseName);
    for (const k of Object.keys(LIFTS) as (keyof typeof LIFTS)[])
      if (n(name, LIFTS[k])) counts[k]++;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0][1] >= 2
    ? `${entries[0][0][0].toUpperCase()}${entries[0][0].slice(1)} Day`
    : null;
}

function groupTally(exs: Exercise[]) {
  const tally: Record<keyof typeof GROUPS, number> = {
    push: 0,
    pull: 0,
    legs: 0,
    core: 0,
    cardio: 0,
    mobility: 0,
  };
  exs.forEach((e) => {
    const name = normalize(e.exerciseName);
    (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).forEach((g) => {
      if (GROUPS[g].some((r) => r.test(name))) tally[g]++;
    });
  });
  return tally;
}

function choosePattern(tally: ReturnType<typeof groupTally>) {
  const { push, pull, legs, cardio, mobility } = tally;
  const totalMain = push + pull + legs;
  if (cardio && !totalMain) return "Cardio Session";
  if (mobility && !totalMain && !cardio) return "Mobility & Recovery";
  if (totalMain >= 3 && push > 0 && pull > 0 && legs > 0) return "Full Body";
  if (legs >= Math.max(push, pull) && legs >= 2) return "Leg Day";
  if (push > pull && push >= 2) return "Push Day";
  if (pull > push && pull >= 2) return "Pull Day";
  if (push + pull >= 2 && legs === 0) return "Upper Body";
  if (legs >= 2 && push + pull === 0) return "Lower Body";
  return null;
}

/**
 * Generate a nice default title.
 * existingSameDayTitles: pass titles for other workouts on the same date to add "Session 2".
 * flags: { pr?: boolean }
 */
export function defaultTitle(
  workout: Workout,
  existingSameDayTitles: string[] = [],
  flags?: { pr?: boolean }
) {
  const exs = workout.exercises ?? [];
  const dl = dominantLift(exs);
  const pattern = choosePattern(groupTally(exs));
  let base = dl || pattern || "Workout";

  // If there is cardio + strength, make it explicit
  const hasCardio =
    (workout.cardioSessions?.length ?? 0) > 0 ||
    exs.some((e) =>
      GROUPS.cardio.some((r) => r.test(normalize(e.exerciseName)))
    );
  if (
    hasCardio &&
    base !== "Cardio Session" &&
    base !== "Mobility & Recovery"
  ) {
    base += " + Cardio";
  }

  // Session suffix if same-day collision
  const collision = existingSameDayTitles.some((t) => t.trim() === base);
  if (collision) {
    const hour = new Date(workout.createdAt).getHours();
    base +=
      hour < 12 ? " — Morning" : hour < 18 ? " — Afternoon" : " — Evening";
  }

  if (flags?.pr) base = `PR — ${base}`;
  return base;
}
