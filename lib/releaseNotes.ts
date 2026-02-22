export const CURRENT_RELEASE_ID = '2026-02-22b'

export interface ReleaseNote {
  id: string
  date: string
  title: string
  changes: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: '2026-02-22b',
    date: 'February 22, 2026',
    title: 'Progress Page — Phase 8',
    changes: [
      'Progress page is now organised into three tabs: Volume & Intensity, Exercise Metrics, and Deep Analytics',
      'Volume & Intensity tab shows a new Muscle Group Volume chart — see your average sets per week per muscle group at a glance',
      'Exercise Metrics tab now includes a full Personal Records table with estimated 1RM, 5RM and 10RM for every exercise you\'ve logged',
      'Deep Analytics tab (Premiere) shows Training Readiness (green/amber/red traffic light), RPE Creep detection, and Weak Point Analysis against minimum effective volume targets per muscle group',
      'CSV export and advanced analytics are now Premiere-tier features',
    ],
  },
  {
    id: '2026-02-22',
    date: 'February 22, 2026',
    title: 'Progressive Overload & Workout Improvements',
    changes: [
      'Workout inputs now show personalised load and rep targets as ghost text — based on your last session\'s performance and your training goals, the app suggests whether to add a rep or increase the weight',
      'A "New PR!" indicator appears when you log a set that beats your all-time best estimated 1RM for that exercise',
      'Fixed a crash that occurred when navigating back to the dashboard after completing a workout',
    ],
  },
  {
    id: '2026-02-21',
    date: 'February 21, 2026',
    title: 'Exercise Library & Muscle Groups',
    changes: [
      'Exercise library expanded to 60 exercises — including Hip Thrusts, Arnold Press, Bulgarian Split Squat, Cable Fly and more',
      'Muscle groups are now more precise: Quads, Hamstrings, Glutes, Adductors and Abductors replace the generic "Legs" category',
      'Custom exercises can now be deleted from your exercise library, with a warning if the exercise is in an active training block',
      'Workout generation now offers better alternatives based on your available equipment',
    ],
  },
]

// Returns all notes newer than lastSeenId, newest first.
// If lastSeenId is null (new user), returns all notes.
export function getUnseenReleaseNotes(lastSeenId: string | null): ReleaseNote[] {
  const unseen = lastSeenId
    ? RELEASE_NOTES.filter((n) => n.id > lastSeenId)
    : [...RELEASE_NOTES]
  return unseen.sort((a, b) => b.id.localeCompare(a.id))
}
