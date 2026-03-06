export const CURRENT_RELEASE_ID = '2026-03-06'

export interface ReleaseNote {
  id: string
  date: string
  title: string
  changes: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: '2026-03-06',
    date: 'March 6, 2026',
    title: 'Bug Fixes',
    changes: [
      'Fixed dashboard showing blank for users who have set up a training block but not yet logged their first workout',
      'Fixed subscription banner still showing immediately after completing checkout — subscription status now updates instantly',
      'Fixed "Manage Billing" silently failing for accounts that have not yet completed checkout — now redirects to the subscription page',
      'Fixed workout exercise list briefly showing the wrong workout\'s exercises when navigating quickly between workout edit pages',
      'Checkout now detects if you are signed in to a different account than the one you subscribed with and prompts you to sign in to the correct account',
    ],
  },
  {
    id: '2026-03-05',
    date: 'March 5, 2026',
    title: 'Subscription & Account Improvements',
    changes: [
      'Email verification is now required before signing in — unverified accounts will be prompted to check their inbox',
      'Stripe subscription is now live — you can subscribe directly from the app',
    ],
  },
  {
    id: '2026-03-04b',
    date: 'March 4, 2026',
    title: 'Bug Fixes',
    changes: [
      'Fixed unilateral exercises (e.g. dumbbell curls logged left/right) not counting reps toward personal records and progressive overload suggestions',
      'Fixed dashboard showing incorrect workout completion date for users outside UTC — dates now display in your local timezone',
      'Dashboard now shows actual workout duration for all completed workouts, and the day it was completed rather than its scheduled day',
    ],
  },
  {
    id: '2026-03-04',
    date: 'March 4, 2026',
    title: 'Email Verification + New Domain',
    changes: [
      'New accounts now require email verification before accessing the app — check your inbox after registering',
      'Existing beta users are automatically verified — no action needed',
      'App is moving to pbxstrength.com.au — you will be redirected automatically',
    ],
  },
  {
    id: '2026-03-03',
    date: 'March 3, 2026',
    title: 'Coach Feature + Olympic Lifts',
    changes: [
      'Coaches can now invite clients by email — clients receive a link to register or log in and are automatically connected',
      'Coaches can build full training blocks for their clients, including phase structure, active and recovery weeks, and equipment selection',
      'Clients can view their coach-assigned training plan and log workouts directly from it',
      'New messaging system between coaches and clients, accessible from the My Coach page',
      'Olympic Lifts training split added — alternates clean-focused (A) and snatch-focused (B) sessions, with 25 new exercises including power clean, hang snatch, split jerk, and overhead squat variants',
    ],
  },
  {
    id: '2026-02-28',
    date: 'February 28, 2026',
    title: 'Rebrand to pbX',
    changes: [
      'App renamed to pbX — Plan, Build, Execute',
      'New orange colour scheme throughout the app',
      'Updated logo mark with cleaner arrow design',
    ],
  },
  {
    id: '2026-02-26',
    date: 'February 26, 2026',
    title: 'Bug Fixes',
    changes: [
      'Fixed a bug where unilateral exercises (e.g. dumbbell curls logged left/right separately) were incorrectly auto-skipped when the incomplete-sets prompt appeared at the end of a workout',
      'Fixed the Muscle Group Volume chart showing incorrect weekly averages for the 4-week and 3-month periods — averages are now calculated from your actual training history rather than a fixed number of weeks',
    ],
  },
  {
    id: '2026-02-24b',
    date: 'February 24, 2026',
    title: 'Repeat Previous Phase',
    changes: [
      'When rebuilding workouts for Phase 2 or later, you can now choose "Repeat Phase N" to copy the full workout structure from the preceding phase — same exercises, sets, reps, rest times and RIR targets',
      'Recovery weeks automatically reduce sets by 40% when repeating a phase',
    ],
  },
  {
    id: '2026-02-24',
    date: 'February 24, 2026',
    title: 'Install as App',
    changes: [
      'Strength Training App is now installable as a home screen app on iOS and Android — tap "Add to Home Screen" in your browser to get a full-screen experience with no browser chrome',
      'The app now loads instantly and works offline for previously-visited pages',
    ],
  },
  {
    id: '2026-02-23b',
    date: 'February 23, 2026',
    title: 'Bug Fix: Workout Logging',
    changes: [
      'Fixed a critical bug where reps were saved as 0 for most exercises — caused by a React state timing issue on mobile when moving quickly between the weight and reps inputs',
    ],
  },
  {
    id: '2026-02-23',
    date: 'February 23, 2026',
    title: 'Delete Past Workouts',
    changes: [
      'You can now delete past workouts from your history — use the trash icon on any workout in the history list, or the Delete Workout button at the bottom of a workout detail page',
      'Deleting a workout permanently removes all its data, and your progress metrics (PRs, volume, readiness) update immediately to reflect the change',
    ],
  },
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
