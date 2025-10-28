# IronLog 🏋️‍♂️ - in development

A modern React Native (Expo) fitness application designed to help users track their workouts, calculate their one-rep max, and monitor their progress over time.

## Overview 📱

The IronLog App is a complete gym companion built for fitness enthusiasts.
It allows users to log workouts, calculate strength metrics, and visualize their fitness journey.
All data is securely synced with Firebase, ensuring smooth cross-device use (planned for future iOS support).

## Features 🚀

### Authentication 🔐

- Secure Login / Register system for users.  
- Authentication powered by **Firebase Auth**.

### Workout Log 🏋️

- Users can create and log workouts.  
- Each workout includes:  
      - Exercise name  
      - Sets, reps, and weights  
- Exercises are stored locally, and users can add new exercises anytime.  
- Completed workouts are uploaded to Firestore under the user’s unique ID.  

### 1 Rep Max Calculator 💪

- Calculate your **1 Rep Max (1RM)** for:
     - Squat
     - Bench Press
     - Deadlift
     - Muscle-Up
     - Dip
     - Pull-Up
- Uses:
     - **Kilograms (Kg)** + **number of reps** for traditional lifts.
     - **Body weight** + **added weight** + **number of reps** for bodyweight movements.
- Future feature:
     Generate an **interactive Excel-style chart** plotting 1RMs, with KG on the X-axis, Reps on the Y-axis, and color-coded performance zones (from warm red to “red-hot fail”).

  ### Weight Log

  - Track your **body weight** over time.
  - Automatically generate a **progress chart** to visualize trends and milestones.

## Tech Stack 🧠

| Category                   | Technology                                       |
| -------------------------- | ------------------------------------------------ |
| **Frontend**               | React Native (Expo)                              |
| **Backend**                | Firebase (Auth, Firestore, Storage)              |
| **Data Storage**           | Local Storage + Firestore Cloud Sync             |
| **Charts & Visualization** | Planned support using Recharts or Victory Native |
| **Platform**               | Android (initial), iOS (future)                  |

## Roadmap 📈

- User Authentication ✅
- Workout Tracker (Local + Firestore Sync) ✅
- 1RM Calculator ❎
- Weight Log Chart ❎
- 1RM Chart Visualization ❎
- Cloud Storage for Exercise Library ✅
- iOS Support ❎

## Vision 💡

The long-term goal is to make **IronLog** an all-in-one fitness app — combining workout tracking, progress visualization, and strength analytics with a sleek, simple design.
