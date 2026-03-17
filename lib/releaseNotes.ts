export const CURRENT_RELEASE_ID = '2026-03-17b'

export interface ReleaseNote {
  id: string
  date: string
  title: string
  changes: string[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    id: '2026-03-17b',
    date: 'March 17, 2026',
    title: 'Prescribed exercise programming',
    changes: [
      'Coaches and athletes can now prescribe exact per-set targets for exercises (sets × reps × optional weight)',
      'Prescribed exercises pre-fill weight and reps in the workout log',
      'Progressive overload suggestions are bypassed when all sets have prescribed weights',
    ],
  },
  {
    id: '2026-03-16',
    date: 'March 16, 2026',
    title: 'Chart fixes',
    changes: [
      'Removed "legs" as a legacy muscle group from volume and weak point charts',
      'Support contact email updated throughout the app',
    ],
  },
  {
    id: '2026-03-15',
    date: 'March 15, 2026',
    title: 'Coach subscriptions',
    changes: [
      'Coaches can now subscribe to Starter ($19/mo, 5 clients) or Pro ($35/mo, unlimited) plans with a 14-day free trial',
      'Coach billing page at /coach/billing — manage plan, upgrade to Pro, or cancel via Stripe portal',
      'Subscribing to a coach plan automatically activates your COACH account and sets client seat limits',
    ],
  },
  {
    id: '2026-03-14',
    date: 'March 14, 2026',
    title: 'Referrals + Custom Split Fix',
    changes: [
      'Refer a friend — share your link from Settings and you both get 30 days free when they verify their email',
      'Custom split no longer generates Full Body exercises — "Create Default Workout Structure" is hidden for Custom splits',
      'Custom split workouts are now correctly named "Workout 1", "Workout 2" etc.',
    ],
  },
  {
    id: '2026-03-13e',
    date: 'March 13, 2026',
    title: 'Smarter Progressive Overload',
    changes: [
      'Fixed rep suggestions after weight increase — no longer defaults to bottom of range',
      'Fixed rep suggestion when manually changing weight back to last session\'s value',
      'New overload settings: choose when weight increases trigger (top of range, all sets at top, or combo)',
      'RPE auto-deload: automatically reduce weight next session when you rate an exercise "Too Much"',
    ],
  },
  {
    id: '2026-03-13d',
    date: 'March 13, 2026',
    title: 'Core & Elite Plans',
    changes: [
      'Core plan: training block planning, workout logging, progressive overload, and workout history',
      'Elite plan: adds full progress tracking, volume & intensity charts, 1RM trends, deep analytics, and data export',
      'Core plan limit updated to 2 training blocks',
    ],
  },
  {
    id: '2026-03-13c',
    date: 'March 13, 2026',
    title: 'Workout Log Bug Fixes',
    changes: [
      'PR badge now appears correctly on unilateral exercises (e.g. dumbbell curls)',
      'Resuming a saved workout session now restores progressive overload suggestions',
      'Rest timer resumes where it left off if you navigate away mid-countdown',
      'Sets logged count in the workout summary only counts sets with data entered, and ignores removed exercises',
    ],
  },
  {
    id: '2026-03-13b',
    date: 'March 13, 2026',
    title: 'Consistent Exercise Picker',
    changes: [
      'Exercise library: muscle group filter now uses chip buttons matching the workout exercise picker',
      'Swap exercise during a planned workout: now uses the same search + muscle group chip picker instead of a plain dropdown',
    ],
  },
  {
    id: '2026-03-13',
    date: 'March 13, 2026',
    title: 'UI Polish',
    changes: [
      'Register page: dark theme now matches the login page',
      'Subscription expiry banner: dismiss button more prominent',
      'Deep Analytics: training readiness stats displayed in a cleaner horizontal layout',
      'Deep Analytics: adherence now reflects the full phase to date, not just the current week',
    ],
  },
  {
    id: '2026-03-12b',
    date: 'March 12, 2026',
    title: 'How To Guide',
    changes: [
      'New How To page — full guide on app architecture, getting started, progressive overload, manual workouts, and reading your progress charts',
      'How To link added to the navigation',
      '"Learn how pbX works" step added to the welcome checklist',
      'Progress page: "How to read this" link to the relevant guide section',
    ],
  },
  {
    id: '2026-03-12',
    date: 'March 12, 2026',
    title: 'Coach Improvements',
    changes: [
      'Admin: new Coaches page showing all coaches with seat usage and capacity indicator',
      'Coach profile photo upload — set your photo on the About Me page, visible to clients',
      'Coached athlete dashboard: "Message your coach" button added to waiting state cards',
    ],
  },
  {
    id: '2026-03-11b',
    date: 'March 11, 2026',
    title: 'Imperial Units — Full Coverage',
    changes: [
      'Personal Records table now shows 1RM/5RM/10RM in your preferred unit (lbs or kg)',
      'Exercise progress charts (weight, 1RM, volume) now display in your chosen unit',
      'Lift History modal now shows set weights, totals, and averages in your preferred unit',
      'Dashboard stats carousel volume figures now respect metric/imperial preference',
      'Training Comparison chart tooltips and axis now display in your preferred unit',
    ],
  },
  {
    id: '2026-03-11',
    date: 'March 11, 2026',
    title: 'Settings — Units & Account',
    changes: [
      'New Settings page at /settings — manage your account, billing, and display preferences',
      'Choose between Metric (kg) and Imperial (lbs) — weights display in your preferred unit across the workout log and exercise history',
      'Billing management moved to Settings, with your current plan displayed',
      'Password reset link now available in Settings',
    ],
  },
  {
    id: '2026-03-10c',
    date: 'March 10, 2026',
    title: 'Workout Logging Improvements',
    changes: [
      'Free workout now matches planned workout format — RIR column, per-set rest timer, and Skip/Remove buttons with the same styling',
      'Free workout: reorder exercises, swap exercise, and view lift history — all available during a free session',
      'Both workout types now have reorder, swap, history, and remove buttons on every exercise card',
      'Removing an exercise now shows a confirmation prompt before removing it from the session',
      'Fixed: weight field on iOS now correctly shows a decimal keyboard so values like 102.5 kg can be entered',
    ],
  },
  {
    id: '2026-03-10b',
    date: 'March 10, 2026',
    title: 'Unified Exercise Picker',
    changes: [
      'New unified exercise picker used everywhere: workout planner, workout editor, free workout, and coach template builder — consistent search, muscle group filters, and inline custom exercise creation',
      'Custom exercises created inline (e.g. during a free workout) are flagged "Update required" in your exercise library so you can add muscle groups and equipment later',
      'Coach phase builder: exercise picker upgraded to full modal with muscle-group filtering and smart search',
      'Coach fixes: new training blocks are now immediately active (visible to athletes); deleting a client\'s block now correctly returns to the client\'s blocks page',
    ],
  },
  {
    id: '2026-03-10',
    date: 'March 10, 2026',
    title: 'Progressive Overload Fixes',
    changes: [
      'Fixed: rep targets for sets 2 and 3 are now capped at the Set 1 target — a later set will never suggest more reps than Set 1',
      'Fixed: unilateral exercises (e.g. single-leg press, dumbbell lunges) now correctly show progressive overload targets in the Left/Right rep fields',
      'Fixed: bodyweight exercises will never incorrectly show a weight increase suggestion',
    ],
  },
  {
    id: '2026-03-09b',
    date: 'March 9, 2026',
    title: 'Smarter Progressive Overload',
    changes: [
      'Progressive overload projections are now set-aware: when your weight increases, only Set 1 shows a rep target (calculated from your estimated 1RM); remaining sets are left blank so you can go by feel',
      'Rep progression now tracks each set individually — if you added reps on sets 2 and 3 last session, those sets each get their own +1 rep target this time',
      'Rep targets derived from 1RM calculations now always show the lower whole number (e.g. 7 instead of 8 when the calculation lands between them)',
      'Dashboard stats carousel: "All Time" replaced with "Last Week" — shows your actual sessions, time, and volume for the prior completed week',
    ],
  },
  {
    id: '2026-03-09',
    date: 'March 9, 2026',
    title: 'Bug Fixes',
    changes: [
      'Fixed a bug where multiple sets in the same session could each show "New PR!" — only the best set in the session is now flagged',
      'Fixed a rare issue where the email verification message could fail to send during account registration',
    ],
  },
  {
    id: '2026-03-08f',
    date: 'March 8, 2026',
    title: 'Coach Phase Activation',
    changes: [
      'Coaches can now activate individual training phases directly from the block builder — tap "Activate" next to any planned phase to make it live for the client',
      'Athlete dashboard now correctly shows coach-programmed plans even when the first training week starts in the future',
    ],
  },
  {
    id: '2026-03-08e',
    date: 'March 8, 2026',
    title: 'Coached Athlete Dashboard',
    changes: [
      'Athletes with a coach now see a personalised message on the dashboard when their coach is still building the training plan — instead of the generic getting-started screen',
      'When a training block is created but workouts have not yet been programmed, the dashboard shows a "your coach is building your workouts" placeholder rather than a blank panel',
    ],
  },
  {
    id: '2026-03-08d',
    date: 'March 8, 2026',
    title: 'Progress Chart Improvements',
    changes: [
      'All progress charts now use the app\'s orange colour scheme',
      'Exercise progress weight chart changed to a column chart — one column per session, easier to compare across workouts',
      'Muscle group volume chart and weak point analysis now both exclude the current partial week for consistent averages',
    ],
  },
  {
    id: '2026-03-08c',
    date: 'March 8, 2026',
    title: 'Exercise Library & Analytics Fixes',
    changes: [
      'Calf exercises added to the library: Standing Calf Raise (barbell, dumbbell, machine), Seated Calf Raise, Single Leg Calf Raise, Leg Press Calf Raise, Donkey Calf Raise, Smith Machine and Cable Calf Raise',
      'Muscle group volume chart now uses the correct fixed period length as the weekly average divisor — 4-week view always divides by 4, 3-month by 13, fixing inflated or deflated averages',
      'Weak Point Analysis now always reflects your current active training phase instead of the selected time period',
    ],
  },
  {
    id: '2026-03-08b',
    date: 'March 8, 2026',
    title: 'Free Workout Rebuild & Analytics Improvements',
    changes: [
      'Free workout (Start a Workout) rebuilt to match the full workout logging experience — timer, per-set skip and delete, copy previous set values, and a clean finish modal',
      'Exercise search in free workouts now surfaces exercises from muscle groups you\'ve already selected — making it faster to build balanced sessions',
      'Custom exercises can be created directly from the exercise picker during any workout',
      'Training Readiness now requires at least 10 logged workouts before showing — prevents misleading scores for new accounts',
      'Readiness adherence is now calculated against the current week\'s workouts only (not the whole phase)',
      'Lift progression data is now scoped to your current active training phase rather than any historical data',
    ],
  },
  {
    id: '2026-03-08',
    date: 'March 8, 2026',
    title: 'Analytics Improvements & Coach Fixes',
    changes: [
      'Training Readiness now factors in lift progression — rising RPE while your lifts improve is flagged as adaptation (amber), not high fatigue (red)',
      'New "Recent Highlights" card shows your top performing exercises with weight and volume gains',
      'Weekly volume averages for active training blocks are now calculated correctly — no longer deflated by future unelapsed weeks',
      'Calves added to the Weak Point chart with a minimum effective volume target',
      'Coach dashboard now shows pending invites correctly — invites appear immediately after sending, with expiry date',
      'My Coach page now displays your coach\'s bio, phone number, and office hours',
      'Phase template builder: week dot navigation added to the user phase page',
    ],
  },
  {
    id: '2026-03-07d',
    date: 'March 7, 2026',
    title: 'Coach Template Workout Builder',
    changes: [
      'Coach template workout editor now matches the full user workout builder — drag-and-drop exercise reordering, full exercise form with sets, reps, RIR, rest, tempo, notes, and superset grouping',
    ],
  },
  {
    id: '2026-03-07c',
    date: 'March 7, 2026',
    title: 'Coach UI Polish',
    changes: [
      'Coach client pages are now fully mobile-optimised — tab navigation scrolls horizontally on small screens instead of overflowing',
      'Client overview stats and phase details display cleanly on all screen sizes',
      'All internal navigation now uses fast client-side routing throughout the coach area',
    ],
  },
  {
    id: '2026-03-07b',
    date: 'March 7, 2026',
    title: 'Email Verification & Privacy Policy',
    changes: [
      'Fixed email verification flow — after registering you are now directed to a "Check your inbox" page instead of the login screen',
      'Verification emails now send reliably, and the resend button on the verification page works correctly',
      'Privacy Policy published at pbxstrength.com.au/privacy',
    ],
  },
  {
    id: '2026-03-07',
    date: 'March 7, 2026',
    title: 'Subscription Checkout Fix',
    changes: [
      'Fixed checkout flow redirecting to login page after returning from Stripe — expired trial users can now complete checkout without losing their session',
      'Fixed subscription banners still showing after checkout — subscription status now updates immediately in the current session without requiring a re-login',
    ],
  },
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
