GCSE Revision Planner – Product Requirements Document (v1)
1. Overview

Product name: GCSE Revision Planner
Type: Private family web application
Users: 1 student, 1 parent
Purpose: Help a GCSE student (10 subjects) plan, track, and complete revision in a structured way leading up to known exam dates.

This is a private tool for household use, not a public SaaS product.

2. Goals
Primary Goals

Provide clear weekly and daily revision planning

Track topic coverage and confidence

Track completed revision time

Highlight urgency as exam dates approach

Give parent visibility without micromanagement

Success Criteria

Student can create a weekly plan in under 10 minutes

Marking a session “done” takes <5 seconds

Parent can see weekly progress at a glance

Student consistently meets weekly revision targets

3. Users & Roles
Student

Create/edit subjects and topics

Create weekly and daily revision sessions

Mark sessions as done, skipped, or moved

Update topic status and confidence

View dashboards and progress

Parent

Separate login

Read-only access by default

Can set weekly revision target

Can view all dashboards and risk indicators

Cannot edit student data in v1 (configurable later)

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

Learning

Revising

Confident

Difficulty (1–5)

Priority (Low / Normal / High)

Optional notes

The system must:

Allow quick status updates

Show topics never revised

Show topics not revised in last X days

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

Today’s sessions

“Next session” highlight

Quick mark done button

4.5 Dashboard
Student Dashboard

Today’s sessions

This week’s progress bar

Total hours completed this week

Streak (days with ≥1 completed session)

Exam countdown per subject

Parent Dashboard

Total weekly hours vs target

Subjects below target

Topics never revised

Exams within 30 days with low coverage

4.6 Targets

The system must allow:

Weekly overall revision hour target

Optional per-subject weekly target

Visual indicator when behind schedule

5. Scheduling Logic (Simple v1 Rules)

The system should calculate a simple topic priority score based on:

Days until exam

Topic difficulty

Topic status (not confident = higher priority)

Days since last revised

When planning sessions:

Suggest high-priority topics

Warn if more than 2 high-difficulty sessions back-to-back

Warn if daily total exceeds configurable limit (e.g., 2 hours on school night)

No AI required in v1.

6. Non-Functional Requirements

Private, authenticated access required

Separate student and parent accounts

Responsive design (mobile-first)

Page loads <2 seconds on broadband

Data persistence and backup

Export data to JSON or CSV

7. Out of Scope (v1)

AI tutoring

Flashcard engine

Automatic full timetable generation

School system integration

Multi-student households

Public sharing

8. Technical Assumptions (Initial Build)

Single household (one partition key)

Two authenticated users

Serverless backend

Low traffic (<50 requests per day)

Low cost expected (<£5/month)

9. MVP Definition

v1 is complete when:

Subjects and exam dates can be created

Topics can be managed and updated

Weekly sessions can be created

Sessions can be marked done/skipped/moved

Dashboard shows weekly progress and exam countdown

Parent login works and displays read-only dashboard