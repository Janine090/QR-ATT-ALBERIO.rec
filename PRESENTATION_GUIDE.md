# QR Attendance App - Finals Presentation Guide

## 1. 30-second pitch

> "Our QR Attendance App replaces manual roll call with a fast, secure, role-based check-in system. Teachers create an event and generate a QR code. Students scan it with their phone, and their attendance is saved instantly to the cloud. The app has separate experiences for teachers and students, a modern dashboard-style interface, secure sessions, and database-level security rules."

---

## 2. Before vs after

| Area | Before | After |
| --- | --- | --- |
| Visual style | Default white screens, mixed emoji icons, basic cards | Dark navy "IT dashboard" theme with cyan/violet accents, consistent Ionicons, custom SVG logo and background |
| Navigation | Same tabs for everyone | Role-aware tabs: students get Scan and History; teachers get Events and History |
| Dashboard | Simple list of actions | Greeting, live stats, hero action card, quick actions, recent activity, pull-to-refresh |
| Teacher flow | Basic form and QR code | Event console with auto-generated code, date/time pickers, duration chips, QR card, share button, recent sessions |
| Scanner | Plain camera view | Animated scan frame, torch control, identity pill, permission screen, result sheet, teacher guard |
| History | Basic list | Role-aware stats, student timeline, expandable teacher attendee lists, empty states |
| Profile | Basic text | Avatar hero, editable display name, account details, system info, sign-out confirmation |
| Auth | Plain forms | Branded login/register, password visibility, role cards, inline validation and success states |
| Session storage | AsyncStorage | Chunked Expo SecureStore adapter with automatic token refresh |
| Security | UI-level role checks | Database RLS policies, teacher-only event creation, DB-based event time validation, duplicate prevention |
| Code structure | Repeated screen styles | Shared design tokens and reusable UI components |

---

## 3. What the app does

### Student
- Registers or logs in.
- Sees a personal dashboard with check-in count and last scan.
- Opens the scanner and scans the teacher's event QR.
- Gets a clear success, duplicate, early, late, or invalid-code message.
- Reviews attendance history with dates and event titles.
- Edits display name and signs out securely.

### Teacher
- Registers or logs in as a teacher.
- Creates an event with a title, date, start time, end time, and auto-generated event code.
- Generates a QR code and shares it with students.
- Monitors check-ins in the History tab.
- Expands an event to see attendee names and scan times.
- Edits profile and signs out securely.

---

## 4. Tech stack

- **Expo SDK 57 + React Native** - cross-platform mobile app.
- **Expo Router** - file-based navigation and protected tab routes.
- **TypeScript** - strict typing for screens, data, and components.
- **Supabase Auth** - email/password accounts and session management.
- **Supabase Postgres** - events, profiles, and attendance data.
- **Row Level Security (RLS)** - server-side access rules.
- **Expo SecureStore** - encrypted native session storage.
- **expo-camera** - QR scanning.
- **react-native-qrcode-svg** - QR generation.
- **@expo/vector-icons (Ionicons)** - consistent icon system.
- **react-native-reanimated** - scan animation and screen fade-ins.

---

## 5. Project structure

```text
app/
  _layout.tsx          Root stack, session redirect, loading screen
  login.tsx            Branded login
  register.tsx         Branded registration with role selection
  (tabs)/
    _layout.tsx        Role-aware floating tab bar
    index.tsx          Dashboard
    teacher.tsx        Event creation + QR console
    scan.tsx           Camera scanner + attendance result
    history.tsx        Student/teacher attendance log
    profile.tsx        Profile and account settings

components/
  ProfileProvider.tsx  Shared profile/role context
  AppButton.tsx        Button variants
  ui/                  Design-system components

constants/
  colors.ts            Color palette
  theme.ts             Spacing, radius, typography, shadows

lib/
  supabase.ts          Supabase client + secure session storage + token refresh
  secureStorage.ts     Chunked SecureStore adapter
  auth.ts              Sign-in, sign-up, sign-out, profile sync, error messages
  profiles.ts          Profile queries and updates
  events.ts            Event creation and lookup
  attendance.ts        Attendance registration and history
  qr.ts                QR payload build/parse

supabase/
  schema.sql           Tables, triggers, RLS policies
```

---

## 6. How the QR flow works

1. The teacher enters the event details.
2. The app creates a random event code, for example `A1B2C3D4`.
3. The event row is saved in Supabase with the teacher's user ID, start time, and end time.
4. The app builds a JSON payload:

   ```json
   {
     "v": 1,
     "event": "A1B2C3D4",
     "title": "Finals Demo",
     "start": "2026-10-25T09:00:00.000Z",
     "end": "2026-10-25T10:00:00.000Z"
   }
   ```

5. `react-native-qrcode-svg` renders the payload as a QR code.
6. A student scans the QR with `expo-camera`.
7. The app parses the payload and fetches the event from Supabase by event code.
8. The app checks the **database** start and end times, so a modified QR cannot bypass the event window.
9. The app inserts one attendance row for the signed-in student.
10. A unique constraint `(student_id, event_id)` prevents duplicate check-ins.
11. The result is shown as a success, duplicate, early, late, or invalid message.

---

## 7. Security and data integrity

These are the strongest engineering talking points:

- **Authentication required** - attendance and event data require a signed-in Supabase user.
- **Secure session storage** - tokens are stored in encrypted SecureStore, not plain AsyncStorage. The adapter splits large tokens into chunks because SecureStore has a value size limit.
- **Automatic token refresh** - the Supabase client refreshes sessions when the app returns to the foreground.
- **Database-level roles** - the `public.is_teacher(uid)` function checks the profile role. Only teacher accounts can insert events through the API, even if someone bypasses the UI.
- **RLS on all tables** - students can read their own attendance, teachers can read attendance for events they created, and profiles are limited to the owner or a teacher with a legitimate attendance relationship.
- **Duplicate prevention** - a database unique constraint plus handling of error code `23505` stops double check-ins.
- **Server-side time validation** - the app uses the event's stored start/end times, not only the QR payload.
- **No unknown-event creation** - scanning a QR for an event that does not exist returns "Event not found" instead of creating an event from the student's device.
- **UI guards** - students do not see the Events tab, teachers do not see the Scan tab, and direct access to a restricted screen shows a locked state.
- **No secret keys in the app** - only the Supabase publishable/anon key is used. The service role key is never shipped.

> Important: re-run `supabase/schema.sql` in the Supabase SQL Editor once so the new `is_teacher` function and "Teachers can insert events" policy are applied.

---

## 8. UI/UX design decisions

Use this section when explaining the redesign:

- **Dashboard-first layout** - information is grouped into stats, primary action, quick actions, and recent activity instead of one long list.
- **Consistent color system** - one palette in `constants/colors.ts`; cyan is the primary action, violet is secondary, green is success, red is error.
- **Design tokens** - spacing, radius, typography, and shadows live in `constants/theme.ts`, so screens look consistent and are easier to maintain.
- **Reusable components** - `Card`, `Badge`, `StatCard`, `FormField`, `EmptyState`, `ScreenHeader`, etc. reduce duplicated styles.
- **Icon system** - Ionicons are used everywhere instead of emoji; a custom SVG logo and background give the app a product identity.
- **Monospace details** - event codes, dates, and IDs use a monospace font to create the "technical dashboard" feel.
- **Motion with purpose** - fade-in sections, animated scan laser, and pulsing result states guide attention without slowing the user down.
- **Role-aware navigation** - the tab bar changes per role, so users only see relevant actions.
- **Clear feedback** - every important action has a loading state, success state, or readable error message.

---

## 9. Live demo script (about 7 minutes)

### Before the demo
- Run the updated `supabase/schema.sql` in the Supabase SQL Editor.
- Prepare one teacher account and one student account.
- Prepare two devices if possible: one teacher device and one student device.
- Make sure both devices have internet.
- Test one full flow before presenting: create event, scan, check history, scan again.

### Demo steps

1. **Login as teacher**
   - Point out the branded login screen and the "Secure / Cloud logs" badges.
   - Log in.
   - On the dashboard, point out the greeting, stats, hero card, quick actions, and recent activity.
   - Point out the tab bar: Events, History, Profile. There is no Scan tab for teachers.

2. **Create an event**
   - Open Events.
   - Show the auto-generated event code.
   - Enter a title such as "Finals Demo".
   - Pick today's date and a start/end time that includes the current time.
   - Point out the duration chips.
   - Tap Generate QR.
   - Show the QR card and event details. Tap Share if you want to show the share sheet.

3. **Login as student**
   - On the second device, log in with the student account.
   - Point out the dashboard differences: check-in count, last scan, and a Scan tab.
   - Explain that the same app changes its navigation based on the profile role.

4. **Scan the QR**
   - Open Scan.
   - Grant camera permission if asked.
   - Point out the identity pill, animated scan frame, and torch toggle.
   - Scan the teacher's QR.
   - Show the success result and event title.
   - Scan the same QR again and show the duplicate message.

5. **Show history**
   - On the student device, open History and show the timeline card with the event and scan time.
   - On the teacher device, open History and expand the event.
   - Show attendee names and scan times.

6. **Show profile**
   - Open Profile.
   - Edit the display name and save.
   - Show account details and system information.
   - Tap Sign out and show the confirmation dialog.

7. **Close strongly**
   - "The UI is now a role-based dashboard, but the important part is under the hood: secure sessions, database-enforced roles, RLS, duplicate prevention, and server-side time validation."

---

## 10. How to run

```bash
npm install
npx expo start -c
```

Then open the app in Expo Go or your development build.

- `-c` clears the Metro cache. Run it after changing `.env`.
- If you build an APK, `EXPO_PUBLIC_*` values are baked in at build time.
- For a preview APK, use your existing EAS setup, for example:

```bash
npx eas build -p android --profile preview
```

Verification commands used during development:

```bash
npx tsc --noEmit
npx expo export --platform web
```

---

## 11. Q&A cheat sheet

**Why did you use Supabase?**
It gives us authentication, a Postgres database, and row-level security without building a separate backend. That let us focus on the mobile experience and security rules.

**How do you prevent fake attendance?**
A student must be signed in. Attendance is tied to `auth.uid()`. The event must exist in the database, the event time window is checked from the database, and the unique constraint prevents duplicates.

**What if a student shares the QR code?**
The event time window limits when it works, and each student can only check in once. A future version can use rotating QR codes or a short-lived signed token.

**How are teacher and student roles enforced?**
The UI hides teacher-only screens, and the database also enforces it with an `is_teacher` check in the event insert policy. Hiding a tab alone is not enough.

**How is the session kept secure?**
Supabase session data is stored with Expo SecureStore, which uses encrypted native storage. The app also refreshes the session when it returns to the foreground.

**What happens if the same student scans twice?**
The database unique constraint rejects the second insert. The app detects error code `23505` and shows "Already registered for this event."

**Why not just use AsyncStorage?**
AsyncStorage is not encrypted. SecureStore is the safer choice for authentication tokens.

**Does the app work offline?**
It needs internet for authentication and saving attendance. A future version could queue scans locally and sync when the connection returns.

**What was the biggest UI improvement?**
The app moved from separate basic screens to one consistent design system: shared colors, spacing, typography, reusable cards and buttons, consistent icons, role-aware navigation, and clear feedback states.

**What is the biggest technical improvement?**
Security moved from UI-only checks to database-enforced rules, and the check-in flow now validates the event against the database instead of trusting the QR payload.

---

## 12. Limitations and future work

Be honest about these if asked:

- Attendance updates require pull-to-refresh or revisiting the screen; realtime subscriptions can be added next.
- QR payloads are not cryptographically signed yet; rotating/signed codes would make sharing harder.
- No geofencing or device binding yet.
- No CSV/PDF export yet.
- No admin dashboard for managing all users and events yet.
- Role assignment is not exposed in the app; in production, role changes should be admin-only.
- No offline queue yet.

These are good "next steps" because they show you understand the system and have a roadmap.

---

## 13. Cebuano quick script

You can say it like this:

> "Sa una, plain screens ra kaayo ang app ug parehas ra ang makita sa teacher ug student. Karon, gi-redesign nako siya into a dark dashboard-style UI with consistent icons, reusable components, ug role-based navigation. Ang teacher naay event console ug QR generator, ang student naay scanner ug attendance history. Ako pud gi-improve ang security: naka-SecureStore ang session, naay RLS sa Supabase, teacher-only ang event creation, gi-check ang event time sa database, ug naay duplicate prevention. So ang app karon mas nindot tan-awon, mas klaro ang flow, ug mas secure."

---

## 14. One-line closing statement

> "This project is not just a prettier UI. It is a complete attendance workflow with role-based experiences, secure authentication, and database-enforced rules."
