TEDxIGDTUW Event Hub & Opportunity Platform
A web application designed for TEDxIGDTUW to launch campus events, issue digital passes with unique IDs and QR codes, manage speaker curation pitches, receive core team applications, and verify attendee check-ins.

[Insert Project Preview Screenshot / Image Here]

Key Features
For Attendees & Students
Browse flagship conferences, workshops, and challenges with real-time search and filters.

Interactive modal flow triggering Sign-Up or Login before pass issuance.

Digital Pass generation featuring user details, a unique Ticket ID, and a QR code.

Pass retrieval using registered college email addresses.

For Speakers & Team Applicants
Submit proposed talk topics, pitches, and past experience for speaker curation.

Apply for specialized roles including Technical, Design, PR, Logistics, and Curation.

Dedicated promotion application pathway for existing team members.

For Organizers & Admins
Protected Admin Portal accessed via passcode authentication.

Live attendance verification to toggle attendee status between Present and Pending.

Centralized database view for attendee lists and candidate applications.

Tech Stack
Frontend: React.js

Styling: Tailwind CSS

Icons: Lucide React

Database: Firebase Firestore

Deployment: Vercel

Project Structure
Plaintext
/src
  ├── App.jsx         - Main React component containing UI views, routing state, and Firestore interactions
  ├── firebase.js     - Firebase configuration and initialization module
  ├── index.css      - Base styling and Tailwind CSS imports
  └── main.jsx        - Application entry point