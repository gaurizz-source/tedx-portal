TEDxIGDTUW Event Hub and Opportunity Platform
A web application designed for TEDxIGDTUW to launch campus events, issue digital event passes with unique IDs and QR codes, manage speaker curation pitches, receive core team recruitment applications, and verify attendee check-ins via an admin portal.

Features
For Attendees and Students
Event Discovery: Browse flagship conferences, workshops, and challenges with search and filter capabilities.

Ticket Registration: Interactive modal flow triggering Sign-Up or Login before pass issuance.

Digital Pass and QR Code: Generates a pass containing user details, unique ID, and QR code representation.

Pass Search: Retrieve previously generated passes using registered email address.

For Speakers and Team Applicants
Speaker Nominations: Submit proposed talk topics, pitches, and past experience for curation review.

Core Team Applications: Apply for specialized roles including Technical, Design, PR, Logistics, and Curation.

Team Promotions: Dedicated application pathway for existing members seeking lead roles.

For Organizers and Admins
Protected Admin Portal: Access control using passcode validation.

Attendance Verification: Toggle attendee status between Present and Pending in real-time.

Application Review: Unified database view for attendee lists and candidate submissions.

Tech Stack
Frontend: React.js

Styling: Tailwind CSS

Icons: Lucide React

Database: Firebase Firestore

Deployment: Vercel

Project Structure
/src
/App.jsx         - Main React component containing UI views, routing state, and Firestore interactions
/firebase.js    - Firebase configuration and initialization module
/index.css      - Base styling and Tailwind CSS imports
/main.jsx       - Application entry point

Installation and Setup
1. Clone Repository
git clone https://github.com/YOUR_USERNAME/tedx-igdtuw-platform.git
cd tedx-igdtuw-platform

2. Install Dependencies
npm install

3. Firebase Configuration
Create a file named firebase.js inside the src directory and insert your credentials:

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_AUTH_DOMAIN",
projectId: "YOUR_PROJECT_ID",
storageBucket: "YOUR_STORAGE_BUCKET",
messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

4. Firestore Collections Setup
Ensure the following collections are available in your Firestore database:

registrations

recruitment_applications

5. Start Development Server
npm run dev

Usage Guide
Access the platform locally at http://localhost:5173

Default Admin Passcode: tedx2026admin

Roadmap
Camera-based QR code scanner integration for fast event check-ins.

Automated email delivery for generated passes.

Export attendee and applicant data to CSV files.

Firebase Authentication implementation for user session management.