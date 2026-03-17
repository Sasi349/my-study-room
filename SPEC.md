# Project Specification

<!-- Paste your requirements below -->
Project Idea: Mobile-First PWA Learning Rooms Platform

Overview:
I want to build a simple full-stack e-learning / knowledge organization platform intended for a very small number of users (single-digit users). The goal is to organize learning materials in a structured way using a hierarchical room-based system.

Core Concept:
The platform organizes information using four levels:

Category → Subject → Subtopic (Room) → Content

Example structure:

Category: Frontend
Subject: NextJS
Subtopic / Room: Navigation

Content inside the room:

* Uploaded files (PDFs, documents)
* Uploaded images or screenshots
* Notes (text)
* Saved links

Another example:

Category: Backend
Subject: ExpressJS
Subtopic / Room: Middleware

Content inside the room:

* Documentation PDFs
* Screenshots of code examples
* Personal notes
* Useful reference links

Users should be able to create categories, subjects inside categories, and rooms inside subjects to store learning resources for specific topics.

Example Usage Flow:

1. User logs into the platform.
2. User creates a category (e.g., "Frontend", "Backend", "Database").
3. User creates a subject under a category (e.g., "NextJS" under Frontend).
4. Inside that subject, the user creates a room (e.g., "Navigation").
5. Inside the room, the user can:

   * Upload files (PDFs, documents).
   * Upload images or screenshots (e.g., diagrams, code screenshots).
   * Write and save text notes.
   * Save useful links.
6. The data must persist in storage.
7. When the user closes the site and opens it later, they can navigate back through the hierarchy and access all saved files, images, notes, and links.
8. Files and images should support both viewing and downloading.

Functional Requirements:

Authentication

* Users must be authenticated before accessing the platform.

Category Management

* Create categories (e.g., Frontend, Backend, DevOps).
* View categories list.

Subject Management

* Create subjects under categories.
* View subjects inside each category.

Room / Topic Management

* Create rooms inside subjects.
* Each room represents a subtopic or concept.

Content Storage
Each room should support:

* Text notes
* Link storage
* File uploads (PDFs, documents)
* Image uploads (screenshots, diagrams)

File & Image Management

* Upload files and images
* View files and images inside the room
* Download files and images later

Persistence

* All notes, files, images, and links must persist after page refresh or reopening the site.

Mobile-First Design

* The UI should be designed mobile-first.
* Must be optimized for phones.

PWA Support
The platform should work as a Progressive Web App:

* Installable on mobile devices
* Opens like a native app
* Uses a web app manifest
* Supports service workers

User Scale

* Intended for very small user base (single-digit users).
* Should be inexpensive or free to host.

Technical Preferences (optional)
Frontend: Next.js
Backend: serverless or simple backend
Database: simple relational or document database
Storage: cloud storage for PDFs and images
Hosting: free tier hosting preferred

Goal:
Build a lightweight personal learning platform that acts like a structured knowledge base where users organize learning materials into categorized subject rooms and revisit them anytime.


