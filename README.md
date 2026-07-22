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
- Expo ~52.0.0
- React Navigation
- TypeScript

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime

## Maps

- OpenStreetMap
- React Native Maps *(reserved for future)*
- Leaflet.js *(prototype evaluation)*

## AI Matching

Matching algorithm based on:

- GPS distance
- Running pace
- Direction
- Availability
- Privacy rules

---

# Repository Structure

```
Running-Partners/
├── frontend/
│   ├── app/              # App-level configurations & providers
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components (Home, Profile)
│   ├── navigation/       # Navigation configuration
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services & business logic
│   ├── utils/            # Utility functions & helpers
│   ├── types/            # TypeScript type definitions
│   └── assets/           # Frontend-specific assets
│
├── backend/
│   └── supabase/
│       ├── sql/migrations/  # Database migration files
│       └── README.md        # Backend setup guide
│
├── assets/               # App icons, splash screens
├── docs/                 # Project documentation
├── .github/              # GitHub workflows
│
└── Configuration Files
    ├── App.tsx               # Root application component
    ├── package.json          # Dependencies & scripts
    ├── tsconfig.json         # TypeScript configuration
    ├── app.json              # Expo configuration
    ├── babel.config.js       # Babel configuration
    ├── .env.example          # Environment variables template
    └── .gitignore            # Git ignore rules
```

---

# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Expo CLI** (will be installed via npx)

For mobile development:
- **iOS**: macOS with Xcode installed
- **Android**: Android Studio with Android SDK
- **Physical Device**: Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Hugooooooo526/Running-Partners.git
cd Running-Partners
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native
- Expo SDK
- React Navigation
- TypeScript dependencies

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MAP_API_KEY=your_map_api_key
```

> **Note:** For Supabase setup, see the [Backend Setup](#backend-setup) section below.

### 4. Add Required Assets (Optional)

Place the following image files in the `/assets` directory:
- `icon.png` (1024x1024 px) - App icon
- `splash.png` (1284x2778 px) - Splash screen
- `adaptive-icon.png` (1024x1024 px) - Android adaptive icon
- `favicon.png` (48x48 px) - Web favicon

> Temporary placeholders will work for initial development.

---

## Running the Application

### Start the Development Server

```bash
npm start
```

Or using Expo CLI directly:

```bash
npx expo start
```

This will start the Metro bundler and display a QR code in your terminal.

### Run on Different Platforms

#### iOS Simulator (macOS only)

```bash
npm run ios
```

Or press `i` in the terminal after running `npm start`.

#### Android Emulator

```bash
npm run android
```

Or press `a` in the terminal after running `npm start`.

#### Physical Device

1. Install **Expo Go** app on your device
2. Scan the QR code from the terminal using:
   - **iOS**: Camera app
   - **Android**: Expo Go app

#### Web Browser

```bash
npm run web
```

Or press `w` in the terminal after running `npm start`.

---

## Backend Setup

### Supabase Configuration

1. **Create a Supabase Project**
   - Visit [https://supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in project details and create

2. **Get Your API Credentials**
   - Go to Project Settings → API
   - Copy your `Project URL` and `anon/public` key
   - Add them to your `.env` file

3. **Database Migrations**
   - Navigate to `backend/supabase/sql/migrations/`
   - Create migration files (e.g., `001_create_users_table.sql`)
   - Run migrations via Supabase Dashboard → SQL Editor

For detailed backend setup, see [`backend/supabase/README.md`](./backend/supabase/README.md).

---

## Project Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Run on Android emulator/device |
| `npm run ios` | Run on iOS simulator (macOS only) |
| `npm run web` | Run in web browser |

---

## Development Workflow

### Current Features

✅ **Navigation**: Bottom tab navigation with Home and Profile screens  
✅ **TypeScript**: Full type safety across the application  
✅ **Project Structure**: Clean, scalable folder organization  
✅ **Backend Ready**: Supabase integration structure prepared

### Implementing New Features

1. **Add a New Screen**
   - Create component in `frontend/screens/`
   - Add route in `frontend/navigation/MainNavigator.tsx`

2. **Create a Component**
   - Add to `frontend/components/`
   - Follow functional component pattern with TypeScript

3. **Add a Custom Hook**
   - Create in `frontend/hooks/`
   - Use TypeScript for type definitions

4. **Integrate API Service**
   - Add service in `frontend/services/`
   - Configure Supabase client connection

---

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache and restart
npx expo start --clear
```

### Dependency Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### iOS Simulator Not Opening

```bash
# Ensure Xcode is installed
xcode-select --install
```

### Android Build Errors

```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

---

## Contributing

This is an academic project for CP2405 / CP5635 at James Cook University Singapore.

### Branch Workflow

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `setup/*` - Setup and configuration branches

### Commit Convention

```
feat: Add new feature
fix: Bug fix
chore: Maintenance tasks
docs: Documentation updates
style: Code style changes
refactor: Code refactoring
test: Test additions
```

---

## Team & Support

For questions or issues related to this project, please contact the development team or your course supervisor

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
