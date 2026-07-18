# Garmin Connect Smart Match

> From Solo Runs to Smart Packs.

An AI-powered real-time runner matching extension designed for the Garmin Connect ecosystem.

This project is developed as part of **CP2405 / CP5635 - Assignment 2** at **James Cook University Singapore**.

Our goal is to transform solo running into a smarter, safer and more social experience by matching runners in real time based on:

- Pace
- GPS location
- Running direction
- Availability

Unlike traditional fitness apps that focus on tracking activities or sharing results after a run, Smart Match helps runners discover compatible running partners instantly while they are already running.

---

# Project Overview

Smart Match introduces a **Real-time Intelligent Matching Layer** on top of Garmin Connect.

The platform continuously analyses live running data and anonymously recommends nearby runners with compatible pace.

Key features include:

- Real-time runner matching
- Anonymous radar
- Dynamic pace grouping
- Privacy-first matching
- AI-powered compatibility engine
- Optional Garmin Companion Tracker
- Community Clubs (Premium)

---

# Prototype

Our current low-fidelity prototype includes two primary mobile screens.

## Home Screen

![Home UI](./assets/home.png)

The Home screen displays:

- Nearby runners
- Interactive radar
- Suggested running partners
- Invite to Jog
- Running streak
- Daily goal

---

## Profile Screen

![Profile UI](./assets/profile.png)

The Profile page provides:

- Running statistics
- Total mileage
- Average pace
- Activity history
- User profile

---

# Technology Stack

## Frontend

- React Native
- Expo
- React Navigation

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime

## Maps

- OpenStreetMap
- Leaflet.js *(prototype evaluation)*
- React Native Maps *(future consideration)*

## AI Matching

Matching algorithm based on

- GPS distance
- Running pace
- Direction
- Availability
- Privacy rules

---

# Repository Structure

```
frontend/
backend/
assets/
docs/
README.md
```

---

# Future Features

- Garmin Connect integration
- Garmin Watch Companion
- AI pace prediction
- Dynamic running packs
- Club management
- Achievement system
- Crowdfunding reward management

---

# Team Members

| Name | Student ID | Role |
|------|------------|------|
| Member 1 | XXXXXXXX | Product Manager |
| Member 2 | XXXXXXXX | Frontend |
| Member 3 | XXXXXXXX | Backend |
| Member 4 | XXXXXXXX | UI / UX |

---

# Supervisor

Professor: **@ProfessorName**

Tutor: **@TutorName**

James Cook University Singapore

CP2405 / CP5635

Assignment 2

2026

---

# Disclaimer

This repository contains a prototype developed for educational purposes as part of CP2405 / CP5635 at James Cook University Singapore.

Garmin Connect is a trademark of Garmin Ltd. This project is an academic concept and is not affiliated with Garmin.
