GCSE Revision Planner – Product Requirements Document (v2)

Last updated: 2026-03-08
Status: v1 shipped

---

1. Overview

Product name: George's GCSE Planner
Type: Private family web application
Users: 1 student (George), 1 parent
Purpose: Help a GCSE student (10 subjects) plan, track, and complete revision in a structured way leading up to known exam dates.

This is a private tool for household use, not a public SaaS product.

---

2. Goals

Primary Goals

Provide clear weekly and daily revision planning

Track topic coverage and confidence

Track completed revision time

Highlight urgency as exam dates approach

Give parent visibility without micromanagement

Success Criteria

Student can create a weekly plan in under 10 minutes

Marking a session "done" takes <5 seconds

Parent can see weekly progress at a glance

Student consistently meets weekly revision targets

---

3. Users & Roles

Student

Create/edit subjects and topics

Create weekly and daily revision sessions

Mark sessions as done, skipped, or moved

Update topic status and confidence

View dashboards and progress

Reset password via email link

Parent

Separate login

Read-only access by default

Can set weekly revision target

Can view all dashboards and risk indicators

Cannot edit student data in v1 (configurable later)

Reset password via email link

---

4. Functional Requirements

4.1 Subjects

The system must support:

10 subjects

Exam date(s) per subject

Optional exam board field

Countdown to next exam paper

Each subject must display:

% topics confident

Hours revised this week

Days until next exam

4.2 Topics

Each subject must support multiple topics.

Topic fields:

Name

Status:

Not Started

Wobbly

Brush Up

Confident

Difficulty (1–5)

Priority (Low / Normal / High)

Optional notes

The system must:

Allow quick status updates

Show topics never revised

Show topics not revised in last X days

Display computed priority score (0–100) per topic

4.3 Revision Sessions

A revision session must include:

Date

Start time

Duration

Subject

Optional topic

Type (Notes / Questions / Past Paper / Flashcards / Other)

Status (Planned / Done / Skipped / Moved)

The system must allow:

Creating sessions in weekly view

Viewing sessions in daily view

Marking session done

Skipping session

Rescheduling session

If skipped:

Option to reschedule to next available slot

Track skipped count

4.4 Planning Views

Weekly View

Monday–Sunday layout

Total planned hours

Total completed hours

Target hours comparison

Quick-add session button

Daily View

Today's sessions

"Next session" highlight

Quick mark done button

4.5 Dashboard

Student Dashboard

Today's sessions

This week's progress bar

Total hours completed this week

Streak (days with ≥1 completed session)

Exam countdown per subject

Parent Dashboard

Total weekly hours vs target

Per-subject progress breakdown

Subjects below target

Topics never revised

Exams within 30 days with low coverage

4.6 Targets

The system must allow:

Weekly overall revision hour target (set by parent)

Optional per-subject weekly target (set per subject by student)

Visual indicator when behind schedule

4.7 Authentication

Email and password login for both users

Password reset via email link (Supabase magic link → /reset-password)

Session persistence via cookies

Route protection via Next.js middleware

---

5. Scheduling Logic (Simple v1 Rules)

The system calculates a topic priority score (0–100) based on:

Exam urgency (35%) — 1 - daysUntilExam / 120

Topic status (30%) — Not Started=1.0, Wobbly=0.75, Brush Up=0.4, Confident=0.1

Staleness (20%) — min(daysSinceRevised / 14, 1); never revised = 1.0

Difficulty (15%) — (difficulty - 1) / 4

When planning sessions:

Topics sorted by priority score descending

Warn if more than 2 high-difficulty sessions back-to-back (weekly view)

Warn if daily total exceeds 120 minutes (daily view)

No AI required in v1.

---

6. Non-Functional Requirements

Private, authenticated access required

Separate student and parent accounts

Responsive design (mobile-first, 390px minimum)

Page loads <2 seconds on broadband

Data persistence via Supabase Postgres

Row Level Security enforced at database level

Export data to JSON or CSV via /api/export

---

7. Out of Scope (v1)

AI tutoring

Flashcard engine

Automatic full timetable generation

School system integration

Multi-student households

Public sharing

---

8. Technical Decisions (v1 Delivered)

Stack: Next.js 14 (App Router) · Supabase (Postgres + Auth) · Vercel · Tailwind CSS · TypeScript

exam_dates stored as JSONB array [{label, date}] — avoids join table for 2–3 dates per subject

weekly_targets is a separate table so parent can write targets without touching student-owned rows

profiles.role stored in DB (not JWT claims) — simpler for 2 static users

RLS helper function is_parent() used across all policies

Server Actions used for all mutations with revalidatePath after each

Priority score computed at read time, not stored

No AI, no external APIs beyond Supabase

---

9. MVP Definition

v1 is complete when: ✅

Subjects and exam dates can be created ✅

Topics can be managed and updated ✅

Weekly sessions can be created ✅

Sessions can be marked done/skipped/moved ✅

Dashboard shows weekly progress and exam countdown ✅

Parent login works and displays read-only dashboard ✅

Password reset works for both users ✅
