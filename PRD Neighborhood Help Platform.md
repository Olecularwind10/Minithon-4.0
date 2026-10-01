# PRD: Neighborhood Help Platform

|                       |                                                            |
| --------------------- | ---------------------------------------------------------- |
| **Status**            | Draft v1.0                                                 |
| **Date**              | 30 Sep 2026                                                |
| **Type**              | Location-based web app / PWA, hackathon MVP                |
| **Primary Challenge** | Real-time location-based smart matching                    |
| **Target Users**      | Local residents, volunteers, helpers, community organizers |

---

# 1. Overview

## 1.1 Problem

People frequently need help with small tasks, local services, urgent situations, or community activities but may not know whom to approach nearby.

At the same time, residents with useful skills, resources, vehicles, spare time, or willingness to help may be available but have no simple way to discover nearby people who need assistance.

Existing platforms are generally designed around commercial services, professional workers, or transactions. They are not optimized for quick, informal, community-level assistance such as:

* Helping an elderly neighbor purchase groceries
* Moving furniture
* Providing basic technical assistance
* Taking care of a pet
* Helping someone carry items
* Tutoring a nearby student
* Participating in a neighborhood clean-up
* Finding a nearby volunteer during an urgent situation

A centralized, location-aware platform is therefore required to connect residents with nearby people who can help, while providing structured request management, communication, trust mechanisms, and community activities.

---

# 1.2 Solution

The Neighborhood Help Platform is a location-based community assistance platform where users can:

1. Create help requests.
2. Offer their skills, resources, or time.
3. Discover nearby requests and helpers.
4. Receive intelligent matches based on location, category, skills, availability, urgency, and trust.
5. Respond to and accept assistance requests.
6. Communicate through in-platform messaging.
7. Track requests from creation to completion.
8. Rate and review users after assistance.
9. Discover local services and community activities.
10. Receive notifications for relevant nearby assistance opportunities.

For the hackathon MVP, the platform assumes Indian cities and neighborhoods such as Mumbai, Pune, Bengaluru, Hyderabad, Delhi NCR, and Chennai. Sample data, map pins, demo requests, and neighborhood references should use Indian localities (for example Powai, Andheri, Baner, Koramangala, Gachibowli, Rohini, and TSEC) instead of non-Indian locations.

The core technical challenge is the **Smart Matching Engine**, which ranks potential helpers based on multiple signals rather than simply showing the nearest person.

---

# 1.3 Goals

1. Create a centralized digital platform for neighborhood-level assistance.
2. Make nearby help requests easy to discover.
3. Match requests with suitable helpers using multiple factors.
4. Reduce the time required to find appropriate assistance.
5. Provide a complete request lifecycle from creation to completion.
6. Build community trust through profiles, verification, ratings, and activity history.
7. Enable private communication without publicly exposing phone numbers.
8. Support community services, volunteering, and local activities.
9. Provide administrators with moderation and reporting tools.
10. Deliver a functional end-to-end MVP suitable for a hackathon demonstration.

---

# 1.4 Non-Goals

The MVP will not attempt to:

* Replace professional service marketplaces.
* Guarantee professional qualifications of helpers.
* Process payments between users.
* Store sensitive financial information.
* Provide emergency medical or law-enforcement services.
* Continuously track users' exact locations.
* Automatically contact emergency services.
* Implement advanced AI/ML requiring large training datasets.
* Provide a full commercial gig marketplace.

The platform is primarily designed for **community assistance and local coordination**.

---

# 2. Target Users & Personas

| Persona                       | Need                                                    |
| ----------------------------- | ------------------------------------------------------- |
| **Help Seeker**               | "I need someone nearby who can help me."                |
| **Community Helper**          | "I have time or skills and want to help people nearby." |
| **Volunteer**                 | "I want to participate in local community activities."  |
| **Community Organizer**       | "I want to organize events and find volunteers."        |
| **Local Service Contributor** | "I want to add useful local services to the directory." |
| **Administrator**             | "I need to keep the platform safe and organized."       |

---

# 3. User Stories

## 3.1 Help Seeker

* As a user, I can create a help request with a description, category, location, time, and urgency.
* As a user, I can mark a request as urgent.
* As a user, I can see nearby helpers.
* As a user, I can receive recommended helpers based on my requirements.
* As a user, I can view a helper's profile, skills, availability, and ratings.
* As a user, I can accept a helper's response.
* As a user, I can communicate with the selected helper without sharing my phone number.
* As a user, I can mark a request as completed.
* As a user, I can rate and review the helper.

## 3.2 Helper

* As a user, I can list skills and resources that I can offer.
* As a user, I can specify when I am available.
* As a user, I can specify the maximum distance I am willing to travel.
* As a user, I can discover nearby requests.
* As a user, I can receive recommended requests.
* As a user, I can respond to a request.
* As a user, I can communicate with the request creator.
* As a user, I can accept or complete an assigned request.
* As a user, I can build a reputation through ratings and completed activities.

## 3.3 Community Organizer

* As an organizer, I can create community events.
* As an organizer, I can specify date, time, location, and required volunteers.
* As an organizer, I can see participants.
* As an organizer, I can manage event status.

## 3.4 Administrator

* As an admin, I can manage users.
* As an admin, I can review reported content.
* As an admin, I can remove inappropriate requests.
* As an admin, I can suspend users.
* As an admin, I can manage community directory entries.
* As an admin, I can monitor platform activity.

---

# 4. Functional Requirements

# FR-1 Users & Profiles

The platform shall provide user registration, authentication, and profile management.

## User fields

| Field              | Description                               |
| ------------------ | ----------------------------------------- |
| Name               | User's display name                       |
| Email              | Account identifier                        |
| Password           | Securely stored authentication credential |
| Profile picture    | Optional                                  |
| Location           | Neighborhood/general location             |
| Latitude/Longitude | Used for matching                         |
| Skills             | Skills the user can offer                 |
| Categories         | Assistance categories                     |
| Availability       | Available days/times                      |
| Service radius     | Maximum distance willing to travel        |
| Rating             | Average community rating                  |
| Completed helps    | Number of completed requests              |
| Verification       | Verification status                       |

### Privacy

Exact addresses should not be publicly displayed.

The platform should preferably show:

> "1.4 km away"

instead of:

> "House No. 42, XYZ Street."

### Acceptance Criteria

* User can register and log in.
* User can edit their skills and availability.
* User can set/update location.
* User can specify a service radius.
* User can view their rating and completed activities.
* Private contact information is not publicly displayed.

---

# FR-2 Help Requests & Offers

Users can create assistance requests.

## Request fields

| Field           | Description                  |
| --------------- | ---------------------------- |
| Title           | Short description            |
| Description     | Detailed requirement         |
| Category        | Type of assistance           |
| Location        | Request location             |
| Date            | Required date                |
| Time            | Required time                |
| Duration        | Estimated duration           |
| Urgency         | Low / Medium / High / Urgent |
| Required skills | Skills needed                |
| Image           | Optional supporting image    |
| Status          | Current request state        |

## Example

**Title:** Need help moving a table

**Category:** Moving

**Description:**
Need one person to help move a table from the first floor to the ground floor.

**Time:** 5:00 PM

**Urgency:** Medium

**Location:** 1.5 km from user

---

## Help Offer

Users can create offers such as:

> "I can provide computer troubleshooting help on weekends within 5 km."

Offer fields:

* Category
* Skills
* Description
* Availability
* Service radius
* Preferred request types

### Acceptance Criteria

* Request can be created in under 2 minutes.
* Urgency is clearly visible.
* Open requests can be discovered by other users.
* Users can create both requests and offers.
* Users can edit or cancel their own requests.

---

# FR-3 Location-Based Discovery

The system shall identify nearby:

* Help requests
* Helpers
* Community activities
* Local services

Location may be obtained through:

* Browser Geolocation API
* User-selected neighborhood
* Manually entered approximate location

The system should calculate distance between users and requests using geographic coordinates.

## Distance Calculation

For two coordinates:

* Latitude₁, Longitude₁
* Latitude₂, Longitude₂

the system can use the Haversine formula:

```text
a = sin²(Δlat/2)
    + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)

c = 2 × atan2(√a, √(1-a))

distance = R × c
```

where:

```text
R = 6371 km
```

### Acceptance Criteria

* Nearby requests are sorted by relevance.
* Distance is calculated correctly.
* User can filter by maximum distance.
* Exact addresses are not exposed publicly.
* Location-dependent results update when location changes.

---

# FR-4 Smart Matching Engine

This is the **core challenging requirement**.

The system should not simply return the closest user.

It should calculate a compatibility score based on:

1. Location
2. Skill/category match
3. Availability
4. Rating/trust
5. Urgency
6. Service radius

---

## 4.1 Matching Score

For MVP, use a weighted scoring model:

```text
Match Score =
    35% × Location Score
  + 30% × Skill Match
  + 20% × Availability
  + 10% × Trust Score
  + 5% × Urgency Responsiveness
```

All values are normalized to `[0,1]`.

Final score:

```text
M(h,r) =
0.35L +
0.30S +
0.20A +
0.10T +
0.05U
```

where:

* `L` = location score
* `S` = skill/category similarity
* `A` = availability match
* `T` = trust score
* `U` = urgency responsiveness

---

## 4.2 Location Score

A helper closer to the request receives a higher score.

For example:

```text
L = max(0, 1 - distance / maximum_radius)
```

Example:

| Distance | Location Score |
| -------: | -------------: |
|     0 km |           1.00 |
|     1 km |           0.90 |
|     2 km |           0.80 |
|     5 km |           0.50 |
|    10 km |           0.00 |

The actual maximum radius can be configured.

---

# 4.3 Skill Match

Skill similarity can be calculated using category and skill overlap.

Example:

Request:

```text
Category: Technical Help
Required Skills:
- Laptop repair
- Windows troubleshooting
```

Helper:

```text
Skills:
- Laptop repair
- Windows troubleshooting
- Hardware installation
```

The helper receives a high skill score.

For MVP:

```text
Skill Match =
matching skills / required skills
```

If 2 of 2 required skills match:

```text
Skill Match = 1.0
```

---

# 4.4 Availability Score

Availability should compare:

```text
requested date/time
```

against:

```text
helper availability
```

Example:

```text
Request: Saturday, 5 PM

Helper A: Saturday, 4 PM–7 PM → 1.0
Helper B: Saturday, 8 AM–12 PM → 0
Helper C: Weekends, flexible → 1.0
```

---

# 4.5 Trust Score

Trust can combine:

* Average rating
* Number of completed requests
* Verification status
* Successful completion rate

Example:

```text
Trust Score =
0.50 × normalized_rating
+ 0.30 × completion_rate
+ 0.20 × verification
```

A new user should not automatically receive a zero score.

A minimum/default trust value can be used for new accounts.

---

# 4.6 Urgency

Urgent requests should increase notification priority.

Example:

```text
Low       → 0.25
Medium    → 0.50
High      → 0.75
Urgent    → 1.00
```

Urgency should primarily affect **visibility and notification priority**, rather than unfairly overriding skill or safety requirements.

---

# 4.7 Match Explanation

The platform should explain recommendations.

Instead of:

> Rahul — 92%

show:

> **Rahul — 92% Match**
>
> 📍 1.2 km away
> 🛠 2/2 required skills match
> 🕐 Available at requested time
> ⭐ 4.7 rating
> ✓ Verified

This makes the matching system transparent and easier to demonstrate.

---

# 4.8 Matching Acceptance Criteria

* Matching results are generated within a few seconds.
* Results consider at least location, skill, availability, and rating.
* Results are ranked by match score.
* Users can see why a match was recommended.
* Changing a request's category or location changes recommendations.
* Helpers outside their configured service radius are excluded.
* Urgent requests receive higher visibility.

---

# FR-5 Request Lifecycle

Every request shall follow a structured lifecycle.

```text
DRAFT
  ↓
OPEN
  ↓
RESPONSES RECEIVED
  ↓
ACCEPTED
  ↓
IN PROGRESS
  ↓
COMPLETED
```

Alternative states:

```text
CANCELLED
EXPIRED
REPORTED
```

## Example

1. User creates request.
2. System finds nearby helpers.
3. Helpers respond.
4. Request owner reviews profiles.
5. Owner accepts one helper.
6. Request becomes `ACCEPTED`.
7. Both users communicate.
8. Assistance takes place.
9. Request becomes `COMPLETED`.
10. Users provide feedback.

### Acceptance Criteria

* Request status is visible at all times.
* Only authorized users can change status.
* Completed requests cannot be accidentally reopened.
* Cancelled requests are retained in history.

---

# FR-6 Responses & Communication

Helpers can respond to open requests.

## Response

A response can contain:

* Message
* Availability confirmation
* Optional estimated arrival time

Request owner can:

* Accept
* Reject
* View helper
* Report helper

---

# FR-7 In-Platform Messaging

Users can communicate through a request-specific chat.

## Requirements

* One-to-one messaging
* Timestamp
* Request association
* Message history
* Unread indicator

Phone numbers and personal contact information should not be automatically exposed.

Example:

```text
Akshata:
Can you help around 5 PM?

Rahul:
Yes, I can reach around 5 PM.
```

### MVP Simplification

For the hackathon, messaging can be implemented as a simple database-backed chat instead of a full real-time WebSocket system.

---

# FR-8 Profiles, Trust & Feedback

After a request is completed, participants can rate each other.

## Rating

```text
1 ★ → Very Poor
2 ★ → Poor
3 ★ → Average
4 ★ → Good
5 ★ → Excellent
```

Optional review:

> "Very helpful and arrived on time."

---

## Reputation

User reputation can consider:

```text
Reputation =
60% Average Rating
+ 25% Completion Rate
+ 15% Verification
```

The exact formula can be configured.

### Acceptance Criteria

* Users can rate only after completed interactions.
* Users cannot rate the same interaction repeatedly.
* Ratings update the user's average.
* Reviews can be reported.

---

# FR-9 Verification

Possible verification mechanisms:

* Email verification
* Phone verification
* Community verification
* Admin verification

Profile badge:

> ✓ Verified Community Member

Verification should be displayed as a trust signal and should not be treated as a guarantee of safety or professional qualification.

---

# FR-10 Community Directory

Users can discover useful local services.

## Categories

* Plumber
* Electrician
* Tutor
* Clinic
* Pharmacy
* Repair service
* Emergency contact
* NGO
* Community center
* Other

## Directory Entry

```text
Service
---------
Name
Category
Description
Location
Operating hours
Contact information
Rating
Added by
Verification status
```

Users can contribute entries.

Admin can review submitted entries.

---

# FR-11 Community Activities

The platform should support:

* Clean-up drives
* Tree plantation
* Blood donation
* Food donation
* Local volunteering
* Community meetings
* Charity activities

## Event fields

```text
Event
---------
Title
Description
Organizer
Location
Date
Time
Maximum participants
Current participants
Status
```

Users can:

* View events
* Join
* Leave
* View participant count

---

# FR-12 Search & Filters

Users should be able to search:

* Help requests
* Helpers
* Skills
* Services
* Community events

## Filters

Filters should include:

* Category
* Distance
* Urgency
* Availability
* Rating
* Date
* Status

## Sorting

Requests can be sorted by:

* Match score
* Distance
* Urgency
* Date
* Rating

### Acceptance Criteria

* Multiple filters can be combined.
* Active filters are clearly displayed.
* Results update without requiring a full page reload.
* Search should remain responsive for at least 500 requests in the MVP dataset.

---

# FR-13 Notifications

Users should receive notifications for:

* New matching request
* New response
* Response accepted
* Response rejected
* New message
* Request status change
* Request completion
* New rating
* Community event reminder

## MVP

Implement:

> In-app notification center

## Future

* Push notifications
* Email
* SMS
* WhatsApp integration

---

# FR-14 Dashboard

The dashboard should provide a centralized view of activity.

## Dashboard Sections

### My Requests

* Active
* Pending
* Accepted
* Completed
* Cancelled

### My Help

* Requests responded to
* Accepted tasks
* Completed tasks

### Recommendations

* Nearby requests
* Recommended helpers

### Notifications

* Responses
* Messages
* Matching requests
* Status changes

### Community

* Upcoming events
* Local services

---

# FR-15 Admin & Moderation

Administrators should have a dedicated moderation panel.

## User Management

* View users
* Search users
* Verify users
* Suspend users
* Delete accounts

## Request Management

* View requests
* Remove inappropriate requests
* Review urgent requests
* Handle reports

## Reports

Users can report:

* Spam
* Harassment
* Fake profiles
* Inappropriate content
* Suspicious behavior
* Unsafe activity

Report lifecycle:

```text
PENDING
   ↓
UNDER REVIEW
   ↓
RESOLVED / DISMISSED
```

---

# 5. Data Model

## User

```text
User {
    id,
    name,
    email,
    passwordHash,
    profileImage,
    latitude,
    longitude,
    neighborhood,
    skills[],
    categories[],
    availability[],
    serviceRadius,
    rating,
    completedRequests,
    verificationStatus,
    createdAt
}
```

## Help Request

```text
HelpRequest {
    id,
    userId,
    title,
    description,
    category,
    requiredSkills[],
    latitude,
    longitude,
    date,
    time,
    duration,
    urgency,
    status,
    createdAt
}
```

## Help Offer

```text
HelpOffer {
    id,
    userId,
    category,
    skills[],
    description,
    availability[],
    serviceRadius,
    createdAt
}
```

## Response

```text
Response {
    id,
    requestId,
    helperId,
    message,
    matchScore,
    status,
    createdAt
}
```

## Message

```text
Message {
    id,
    requestId,
    senderId,
    receiverId,
    message,
    timestamp,
    read
}
```

## Rating

```text
Rating {
    id,
    requestId,
    reviewerId,
    reviewedUserId,
    rating,
    review,
    createdAt
}
```

## Community Event

```text
Event {
    id,
    organizerId,
    title,
    description,
    location,
    latitude,
    longitude,
    date,
    time,
    maxParticipants,
    participants[],
    status
}
```

## Local Service

```text
Service {
    id,
    name,
    category,
    description,
    location,
    latitude,
    longitude,
    contact,
    verified,
    createdBy
}
```

## Report

```text
Report {
    id,
    reporterId,
    reportedUserId,
    requestId,
    reason,
    description,
    status,
    createdAt
}
```

---

# 6. Suggested Architecture

## Frontend

Recommended:

```text
React.js + TypeScript
```

Alternative for very rapid MVP:

```text
HTML + CSS + JavaScript
```

## Backend

```text
Node.js
Express.js
```

## Database

For hackathon:

```text
MongoDB
```

or:

```text
Firebase Firestore
```

Firebase can simplify authentication and real-time messaging.

---

## Location

```text
Browser Geolocation API
        +
Leaflet.js
        +
OpenStreetMap
```

No paid map API is required for the MVP.

---

## Authentication

Possible options:

```text
Firebase Authentication
```

or:

```text
JWT + bcrypt
```

---

## System Architecture

```text
                ┌────────────────────┐
                │      User          │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │   React Frontend   │
                └─────────┬──────────┘
                          │
                    REST / API
                          │
                          ▼
                ┌────────────────────┐
                │ Node.js + Express  │
                └──────┬─────┬───────┘
                       │     │
              ┌────────┘     └─────────┐
              ▼                        ▼
      ┌──────────────┐        ┌─────────────────┐
      │   Database   │        │ Matching Engine │
      └──────────────┘        └────────┬────────┘
                                       │
                             ┌─────────┴─────────┐
                             ▼                   ▼
                         Location             Ranking
                         Skills              Availability
                         Rating               Urgency
```

---

# 7. Smart Matching Algorithm

The matching engine should follow this pipeline:

```text
Create Request
      ↓
Extract Category & Skills
      ↓
Get Request Location
      ↓
Find Helpers Within Radius
      ↓
Filter by Availability
      ↓
Calculate Skill Match
      ↓
Calculate Trust Score
      ↓
Calculate Urgency Priority
      ↓
Calculate Final Match Score
      ↓
Rank Helpers
      ↓
Display Top Matches
```

## Pseudocode

```text
function matchHelpers(request, helpers):

    candidates = []

    for helper in helpers:

        distance = calculateDistance(
            request.location,
            helper.location
        )

        if distance > helper.serviceRadius:
            continue

        locationScore =
            calculateLocationScore(distance)

        skillScore =
            calculateSkillMatch(
                request.requiredSkills,
                helper.skills
            )

        availabilityScore =
            calculateAvailability(
                request.date,
                request.time,
                helper.availability
            )

        trustScore =
            calculateTrust(helper)

        urgencyScore =
            calculateUrgency(request.urgency)

        finalScore =
            0.35 * locationScore +
            0.30 * skillScore +
            0.20 * availabilityScore +
            0.10 * trustScore +
            0.05 * urgencyScore

        candidates.add(
            helper,
            finalScore
        )

    return sortDescending(candidates)
```

The system then displays the top matching helpers.

---

# 8. Privacy & Safety Requirements

Because the platform connects strangers within a community, privacy and safety are important.

## Privacy

The system should:

* Avoid publicly displaying phone numbers.
* Avoid displaying exact home addresses.
* Show approximate distance.
* Collect only required information.
* Allow users to delete their account.
* Allow users to delete their requests.
* Protect private conversations.

## Safety

The system should provide:

* User reporting
* Blocking
* Verification badges
* Moderation
* Request history
* Community ratings

Urgent requests should not be presented as substitutes for professional emergency services.

---

# 9. Non-Functional Requirements

| Area               | Requirement                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| **Performance**    | Matching results should appear within a few seconds                              |
| **Scalability**    | Architecture should support increasing users/requests                            |
| **Security**       | Passwords hashed; authenticated API access                                       |
| **Privacy**        | No unnecessary exposure of personal information                                  |
| **Availability**   | Platform should remain usable during normal network interruptions where possible |
| **Usability**      | Request creation should take less than 2 minutes                                 |
| **Accessibility**  | Clear labels, readable text, keyboard-friendly controls                          |
| **Mobile**         | Responsive mobile-first design                                                   |
| **Explainability** | Match score should show contributing factors                                     |
| **Moderation**     | Reported content should be reviewable by admins                                  |

---

# 10. MVP Scope for Hackathon

Since the hackathon duration is approximately **3 hours 45 minutes**, the implementation should prioritize the end-to-end core flow.

## Must Have

### M1 — Authentication

* Login
* Registration
* Basic profile

### M2 — Help Requests

* Create request
* Select category
* Add location
* Set urgency
* View requests

### M3 — Smart Matching

* Calculate distance
* Match category/skills
* Check availability
* Calculate rating/trust
* Generate match score
* Display top matches

### M4 — Request Lifecycle

```text
Open
→ Respond
→ Accept
→ In Progress
→ Complete
```

### M5 — Communication

Basic request-based chat.

### M6 — Trust

* Rating
* Review
* Completed help count

### M7 — Dashboard

* Active requests
* My requests
* My help
* Notifications

---

# 11. Stretch Features

If the core MVP is completed early:

### Priority 1

* Community directory
* Community events
* Admin moderation

### Priority 2

* Map visualization
* Urgent request notifications
* Verification badges

### Priority 3

* Push notifications
* AI-based natural-language request classification
* Voice-based request creation
* Multilingual support
* Community reward/credit system

---

# 12. Success Metrics

| Metric                            |                Target |
| --------------------------------- | --------------------: |
| Time to create a request          |               < 2 min |
| Matching response time            |               < 3 sec |
| Users receiving ≥1 relevant match |                 ≥ 80% |
| Requests receiving a response     |                 ≥ 60% |
| Request completion rate           |                 ≥ 50% |
| Match ranking consistency         | ≥ 90% on test dataset |
| Dashboard load time               |               < 2 sec |
| User satisfaction                 |        ≥ 80% positive |
| Report resolution                 |            < 24 hours |

---

# 13. Testing Requirements

## Unit Testing

Test:

* Distance calculation
* Skill matching
* Availability matching
* Rating normalization
* Match-score calculation
* Request status transitions

## Matching Test Cases

### Test 1 — Nearby Skilled Helper

```text
Request distance: 1 km
Skill: Exact match
Availability: Yes
Rating: 4.8

Expected: High match
```

### Test 2 — Far Skilled Helper

```text
Request distance: 9 km
Skill: Exact match
Availability: Yes
Rating: 4.9

Expected: Lower than nearby equivalent helper
```

### Test 3 — Nearby Wrong Skill

```text
Distance: 0.5 km
Skill: No match
Availability: Yes

Expected: Low match
```

### Test 4 — Unavailable Helper

```text
Distance: 1 km
Skill: Exact
Availability: No

Expected: Excluded or very low ranking
```

### Test 5 — Urgent Request

```text
Urgency: Urgent
Nearby verified helpers available

Expected:
High visibility
High notification priority
```

---

# 14. Milestones

| Phase                 | Scope                                                  |
| --------------------- | ------------------------------------------------------ |
| **M1: Foundation**    | Project setup, authentication, database, user profiles |
| **M2: Requests**      | Create/view/edit/cancel requests and offers            |
| **M3: Matching Core** | Location, skills, availability, rating and ranking     |
| **M4: Lifecycle**     | Respond, accept, status updates, completion            |
| **M5: Communication** | Request-based messaging and notifications              |
| **M6: Trust**         | Ratings, reviews, verification                         |
| **M7: Community**     | Directory and activities                               |
| **M8: Admin**         | Reports, moderation, user management                   |
| **M9: Polish**        | UI, responsive design, testing, demo preparation       |

---

# 15. Hackathon Execution Plan

For a 3-hour-45-minute hackathon:

## 0:00–0:30 — Setup

* Create project
* Configure database
* Authentication
* Basic UI

## 0:30–1:15 — Request System

* User profile
* Create request
* Request list
* Category and urgency

## 1:15–2:00 — Smart Matching

Implement:

```text
Location
+
Skills
+
Availability
+
Rating
=
Match Score
```

Display:

```text
92% Match
1.2 km away
2/2 skills matched
Available now
4.7★
```

## 2:00–2:40 — Request Lifecycle

Implement:

```text
Respond
→ Accept
→ In Progress
→ Complete
```

Add basic messaging.

## 2:40–3:10 — Trust & Dashboard

* Rating
* Review
* Completed requests
* Dashboard
* Notifications

## 3:10–3:30 — Stretch Features

If the core flow works:

* Map
* Community events
* Directory
* Admin reports

## 3:30–3:45 — Demo Preparation

Prepare one complete scenario:

```text
Create Request
       ↓
Location Detected
       ↓
Nearby Helpers Found
       ↓
Smart Match = 94%
       ↓
Helper Responds
       ↓
Request Accepted
       ↓
Chat
       ↓
Task Completed
       ↓
5★ Rating
```

---

# 16. Risks & Mitigations

| Risk                               | Mitigation                                        |
| ---------------------------------- | ------------------------------------------------- |
| Users enter inaccurate locations   | Allow manual location correction                  |
| Not enough nearby helpers          | Expand search radius gradually                    |
| Matching seems arbitrary           | Show match-score explanation                      |
| New users have no ratings          | Use neutral default trust score                   |
| Fake requests                      | Reporting + moderation                            |
| Privacy concerns                   | Approximate location and private messaging        |
| Unsafe interactions                | Verification, reporting, blocking                 |
| Too much development for hackathon | Prioritize core request-to-completion flow        |
| Real-time messaging takes too long | Implement simple request-based chat               |
| Maps/API problems                  | Use OpenStreetMap + Leaflet or fallback list view |
| Poor match quality                 | Test matching algorithm with predefined scenarios |

---

# 17. Future Scope

Future versions can introduce:

### AI Request Understanding

User can type:

> "I need someone to help my grandmother buy medicines tomorrow evening."

AI extracts:

```text
Category: Elderly Assistance
Time: Tomorrow Evening
Required Help: Medicine Pickup
Urgency: Medium
```

### Voice Requests

Users can speak instead of typing.

### Multilingual Support

Support:

* English
* Hindi
* Marathi
* Other regional languages

### AI Matching

A future model can learn from:

* Previous successful matches
* User preferences
* Response rates
* Completion rates
* Ratings

and improve recommendations over time.

### Community Credits

Users can earn non-monetary community points for helping others.

Example:

```text
Help someone
     ↓
+10 Community Points
     ↓
Community Reputation
```

### Emergency Assistance

Future versions could provide specialized workflows for urgent situations, while clearly directing genuine emergencies to appropriate professional emergency services.

---

# 18. Demo Scenario

A complete demonstration can use the following scenario.

### Step 1 — Create Request

Akshata creates:

> **Need help setting up my laptop**

Category:

```text
Technical Help
```

Required skills:

```text
Laptop troubleshooting
Windows
```

Location:

```text
1.5 km radius
```

Availability:

```text
Today, 6 PM
```

Urgency:

```text
High
```

---

### Step 2 — Matching Engine

The system searches nearby helpers.

| Helper | Distance | Skills | Availability | Rating |   Match |
| ------ | -------: | ------ | ------------ | -----: | ------: |
| Rahul  |   1.2 km | 2/2    | Yes          |    4.7 | **94%** |
| Priya  |   2.4 km | 2/2    | Yes          |    4.5 | **86%** |
| Amit   |   0.8 km | 1/2    | Yes          |    4.8 | **78%** |

System recommends Rahul.

> **94% Match**
> 📍 1.2 km away
> 🛠 2/2 skills matched
> 🕐 Available at 6 PM
> ⭐ 4.7 rating

---

### Step 3 — Response

Rahul responds:

> "I can help at 6 PM."

Akshata accepts.

Status:

```text
OPEN
 ↓
ACCEPTED
```

---

### Step 4 — Communication

They use in-platform chat to coordinate.

No phone number needs to be exposed.

---

### Step 5 — Completion

After the assistance:

```text
IN PROGRESS
     ↓
COMPLETED
```

---

### Step 6 — Feedback

Akshata gives:

```text
★★★★★
```

Review:

> "Very helpful and solved the issue quickly."

Rahul's reputation is updated.

---

### Step 7 — Dashboard

The dashboard now shows:

```text
Overall Activity

Active Requests: 0
Completed Requests: 1
Help Given: 0
Average Rating: 5.0

Recent Activity:
✓ Laptop assistance completed
✓ Rating submitted
```

This demonstrates the complete value chain of the platform:

**Need → Discovery → Smart Matching → Communication → Assistance → Trust**

---

# 19. Final Product Vision

The Neighborhood Help Platform aims to create a **digital layer for local communities**, allowing people to move from:

> **"I need help, but I don't know whom to ask."**

to:

> **"The platform found suitable people nearby who can help."**

The central innovation is not simply displaying nearby users. It is the **explainable smart matching engine** that combines:

```text
Location
    +
Skills
    +
Availability
    +
Trust
    +
Urgency
    ↓
Smart Match
```

The MVP should therefore prioritize one strong end-to-end experience:

> **Create a request → Find nearby helpers → Calculate intelligent match → Respond → Accept → Communicate → Complete → Rate**

Everything else, including the community directory, events, advanced notifications, AI features, and sophisticated administration, can be built around this core workflow in later phases.
