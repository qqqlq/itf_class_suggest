import type { CourseData, SuggestedCourse, TimetableSlot, TimetableConflict } from "@/types";

const DAYS = ["月", "火", "水", "木", "金"] as const;
const PERIODS = [1, 2, 3, 4, 5, 6] as const;
const MODULES = ["春A", "春B", "春C", "秋A", "秋B", "秋C"] as const;

export function parseDayPeriod(dayPeriod: string): { day: string; period: number } | null {
  if (!dayPeriod || dayPeriod.length < 2) return null;
  const day = dayPeriod[0];
  const period = parseInt(dayPeriod.substring(1), 10);
  if (!DAYS.includes(day as typeof DAYS[number]) || isNaN(period)) return null;
  return { day, period };
}

export function buildTimetableSlots(
  suggestions: SuggestedCourse[]
): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  for (const suggestion of suggestions) {
    const parsed = parseDayPeriod(suggestion.course.dayPeriod);
    if (!parsed) continue;
    for (const module of suggestion.course.modules) {
      slots.push({
        day: parsed.day,
        period: parsed.period,
        module,
        course: suggestion,
      });
    }
  }
  return slots;
}

export function detectConflicts(slots: TimetableSlot[]): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];
  const slotMap = new Map<string, TimetableSlot[]>();

  for (const slot of slots) {
    const key = `${slot.day}-${slot.period}-${slot.module}`;
    const existing = slotMap.get(key) || [];
    existing.push(slot);
    slotMap.set(key, existing);
  }

  for (const [key, slotsInCell] of slotMap) {
    if (slotsInCell.length > 1) {
      const [day, periodStr, module] = key.split("-");
      conflicts.push({
        day,
        period: parseInt(periodStr, 10),
        module,
        courses: slotsInCell.map((s) => s.course.course),
      });
    }
  }

  return conflicts;
}

export function hasConflict(
  course: CourseData,
  existingSlots: TimetableSlot[]
): boolean {
  const parsed = parseDayPeriod(course.dayPeriod);
  if (!parsed) return false;

  for (const module of course.modules) {
    const key = `${parsed.day}-${parsed.period}-${module}`;
    const conflict = existingSlots.some(
      (s) => `${s.day}-${s.period}-${s.module}` === key
    );
    if (conflict) return true;
  }
  return false;
}

export { DAYS, PERIODS, MODULES };
