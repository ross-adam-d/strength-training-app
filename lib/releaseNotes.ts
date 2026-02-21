export const CURRENT_RELEASE_ID = '2026-02-21'

export interface ReleaseNote {
  id: string
  date: string
  title: string
  changes: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
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
