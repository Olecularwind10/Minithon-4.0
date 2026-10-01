# ARCHITECTURE: Neighborhood Help Platform

## 1. Architecture Principles

**Location-aware** — Nearby assistance should be easy to discover.

**Privacy-first** — Exact personal addresses and contact information should not be exposed unnecessarily.

**Matching-driven** — Location alone is not enough; skills, availability, ratings and trust should influence recommendations.

**Explainable matching** — Users should understand why a helper or request was recommended.

**Lifecycle-based** — Every help request follows a clear state from creation to completion.

**Trust-aware** — Ratings, verification and activity history contribute to matching.

**Moderated** — Users can report inappropriate, fraudulent or unsafe content.

**Mobile-first** — The application should be designed primarily for smartphones.

**Offline-friendly PWA** — Important screens and previously loaded information should remain accessible when the internet is temporarily unavailable.

**Config-driven matching** — Matching weights should be stored in configuration so they can be changed without rewriting the algorithm.

**Privacy-preserving communication** — Users communicate through the platform rather than exposing personal phone numbers or email addresses.

---

# 2. System Overview

```text
┌──────────────────────────── Neighborhood Help PWA ─────────────────────────────┐
│                                                                               │
│                         React + TypeScript + Vite                             │
│                                                                               │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │ Dashboard     │ │ Discover     │ │ Requests     │ │ Offers           │    │
│  └───────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘    │
│                                                                               │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │ Messages      │ │ Profile      │ │ Directory    │ │ Activities       │    │
│  └───────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘    │
│                                                                               │
│                              │                                                │
│                              ▼                                                │
│                    PWA / Service Worker                                       │
│                    ├── Offline Cache                                           │
│                    ├── Installable App                                        │
│                    └── Network Detection                                      │
│                              │                                                │
│                              ▼                                                │
│                       State Management                                        │
│                         Zustand / Context                                     │
│                              │                                                │
│                              ▼                                                │
│                         Service Layer                                         │
│          ┌───────────────────┼────────────────────┐                            │
│          ▼                   ▼                    ▼                            │
│    RequestService      MatchService        UserService                        │
│          │                   │                    │                            │
│          ▼                   ▼                    ▼                            │
│   Communication       Location/Geo         Trust Service                      │
│                              │                                                │
│                              ▼                                                │
│                         Backend API                                            │
│                              │                                                │
│          ┌───────────────────┼────────────────────┐                            │
│          ▼                   ▼                    ▼                            │
│      SQLite              Matching Engine      Notification                      │
│                                               Service                          │
│          │                   │                    │                            │
│          └───────────────────┼────────────────────┘                            │
│                              ▼                                                │
│                       Admin / Moderation                                       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Recommended Tech Stack

| Concern          | Technology                | Reason                                    |
| ---------------- | ------------------------- | ----------------------------------------- |
| Frontend         | React + TypeScript        | Fast development and reusable components  |
| Build            | Vite                      | Simple and fast                           |
| Styling          | Tailwind CSS              | Rapid UI development                      |
| PWA              | Vite PWA / Service Worker | Offline support and installability        |
| State            | Zustand                   | Lightweight state management              |
| Backend          | Node.js + Express         | Simple REST API                           |
| Database         | Sqlite                | Suitable for relational user/request data |
| Authentication   | JWT / Session             | User authentication                       |
| Real-time        | Socket.IO                 | Messaging and live notifications          |
| Maps             | mapcn     | Free map visualization                    |
| Geo calculations | Haversine / PostGIS       | Distance calculations                     |
| Charts           | Recharts                  | Dashboard statistics                      |
| Testing          | Vitest + Playwright       | Unit and E2E testing                      |
| Deployment       | Vercel + Render/Railway   | Simple deployment                         |

### Very short hackathon stack

For a 3 hour 45 minute hackathon, simplify to:

```text
React + Vite
      +
Node.js + Express
      +
SQLite
      +
Leaflet
      +
Browser LocalStorage
```

If possible, use a ready authentication/database service such as Supabase to reduce backend setup time.

---

# 4. PWA Architecture

The application should behave like a normal website while also being installable as a mobile application.

```text
                    Neighborhood Help PWA
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Online                       Offline
              │                           │
              ▼                           ▼
        Backend API                 Service Worker
              │                           │
              ▼                           ▼
          sqlite                 Cache / Local Data
                                          │
                                          ▼
                                  Previously loaded:
                                  • Requests
                                  • Profile
                                  • Directory
                                  • Activities
                                  • UI assets
```

### Offline functionality

The PWA should allow users to:

* Open the application without internet.
* View previously loaded requests.
* View cached profile information.
* View previously loaded community directory entries.
* View cached activities.
* Create a draft help request offline.
* Store the draft locally.
* Synchronize the request when connectivity returns.

### Online-only operations

Some features require connectivity:

* Real-time messaging.
* Fresh nearby matching.
* Creating a new server-side request.
* Accepting a helper.
* Updating request status.
* Ratings synchronization.

The UI should clearly show:

```text
🟢 Online
🔴 Offline
🔄 Syncing...
```

---

# 5. Module Structure

## Frontend

```text
src/
│
├── components/
│   ├── Navbar/
│   ├── RequestCard/
│   ├── OfferCard/
│   ├── MatchCard/
│   ├── Rating/
│   ├── Map/
│   ├── Notification/
│   └── OfflineBanner/
│
├── pages/
│   ├── Login/
│   ├── Register/
│   ├── Dashboard/
│   ├── Requests/
│   ├── Offers/
│   ├── Discover/
│   ├── Messages/
│   ├── Profile/
│   ├── Directory/
│   ├── Activities/
│   └── Admin/
│
├── services/
│   ├── authService.ts
│   ├── requestService.ts
│   ├── offerService.ts
│   ├── matchService.ts
│   ├── locationService.ts
│   ├── trustService.ts
│   ├── messageService.ts
│   ├── notificationService.ts
│   └── moderationService.ts
│
├── store/
│   ├── authStore.ts
│   ├── requestStore.ts
│   ├── matchStore.ts
│   └── notificationStore.ts
│
├── utils/
│   ├── distance.ts
│   ├── matching.ts
│   ├── validation.ts
│   ├── offline.ts
│   └── constants.ts
│
├── types/
│   ├── user.ts
│   ├── request.ts
│   ├── offer.ts
│   ├── match.ts
│   ├── message.ts
│   └── activity.ts
│
└── pwa/
    ├── serviceWorker.ts
    └── offlineStorage.ts
```

## Backend

```text
server/
│
├── controllers/
│   ├── authController.ts
│   ├── requestController.ts
│   ├── offerController.ts
│   ├── matchController.ts
│   ├── messageController.ts
│   ├── ratingController.ts
│   └── adminController.ts
│
├── services/
│   ├── matchingService.ts
│   ├── trustService.ts
│   ├── notificationService.ts
│   └── moderationService.ts
│
├── models/
│
├── routes/
│
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── admin.ts
│
├── utils/
│
└── config/
    └── matchingConfig.ts
```

---

# 6. Core Data Model

## User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;

  latitude?: number;
  longitude?: number;
  area?: string;

  skills: string[];
  availability: Availability[];

  rating: number;
  completedRequests: number;

  emailVerified: boolean;
  phoneVerified: boolean;

  status: "active" | "suspended";
  createdAt: string;
}
```

## Help Request

```typescript
interface HelpRequest {
  id: string;
  requesterId: string;

  title: string;
  description: string;
  category: string;

  latitude: number;
  longitude: number;
  area: string;

  preferredDate: string;
  preferredTime: string;

  urgency: "low" | "medium" | "high";

  estimatedDuration?: number;

  status:
    | "open"
    | "responses"
    | "accepted"
    | "in_progress"
    | "completed"
    | "cancelled";

  selectedHelperId?: string;

  createdAt: string;
}
```

## Help Offer

```typescript
interface HelpOffer {
  id: string;
  userId: string;

  category: string;
  skills: string[];

  description: string;

  latitude: number;
  longitude: number;

  serviceRadius: number;

  availability: Availability[];

  status: "active" | "inactive";

  createdAt: string;
}
```

## Match

```typescript
interface Match {
  id: string;
  requestId: string;
  helperId: string;

  distanceScore: number;
  skillScore: number;
  availabilityScore: number;
  trustScore: number;
  urgencyScore: number;

  totalScore: number;

  reasons: string[];

  createdAt: string;
}
```

## Message

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;

  content: string;

  read: boolean;
  createdAt: string;
}
```

## Rating

```typescript
interface Rating {
  id: string;
  requestId: string;

  reviewerId: string;
  reviewedUserId: string;

  rating: number;
  comment?: string;

  createdAt: string;
}
```

## Community Activity

```typescript
interface CommunityActivity {
  id: string;
  organizerId: string;

  title: string;
  description: string;
  category: string;

  latitude: number;
  longitude: number;

  date: string;
  time: string;

  maxParticipants?: number;

  status:
    | "upcoming"
    | "ongoing"
    | "completed"
    | "cancelled";
}
```

---

# 7. Matching Engine

The matching engine is the main technical component of the platform.

## Pipeline

```text
                Help Request
                     │
                     ▼
            Find Available Helpers
                     │
                     ▼
            Location Filtering
                     │
                     ▼
              Skill Matching
                     │
                     ▼
          Availability Matching
                     │
                     ▼
              Trust Calculation
                     │
                     ▼
             Urgency Adjustment
                     │
                     ▼
            Calculate Match Score
                     │
                     ▼
              Rank Helpers
                     │
                     ▼
            Top Recommendations
```

## Match Formula

```text
MatchScore =
    0.35 × LocationScore
  + 0.25 × SkillScore
  + 0.15 × AvailabilityScore
  + 0.15 × TrustScore
  + 0.10 × UrgencyScore
```

The weights should be stored in configuration.

Example:

```typescript
const MATCH_WEIGHTS = {
  location: 0.35,
  skill: 0.25,
  availability: 0.15,
  trust: 0.15,
  urgency: 0.10
};
```

### Example

Helper A:

```text
Location       = 95
Skills         = 100
Availability   = 90
Trust          = 92
Urgency        = 80
```

The system calculates the weighted score and ranks the helper against other eligible helpers.

The UI should not only show a number. It should explain the recommendation:

```text
Recommended because:

✓ 1.2 km away
✓ Matches your "Moving" requirement
✓ Available at your requested time
✓ 4.6/5 community rating
✓ Verified profile
```

---

# 8. Location Architecture

The platform should use location for discovery while protecting personal privacy.

```text
GPS / User Location
        │
        ▼
Latitude + Longitude
        │
        ▼
Distance Calculation
        │
        ▼
Nearby Filtering
        │
        ▼
Approximate Location Display
```

## Privacy rule

Do not publicly display exact coordinates such as:

```text
12.9715987, 77.5945627
```

Instead display:

```text
1.4 km away
Near Andheri East
```

Exact location information should only be shared when necessary and authorized.

### Distance formula

Use the Haversine formula:

```text
a = sin²(Δlatitude / 2)
    + cos(latitude1)
    × cos(latitude2)
    × sin²(Δlongitude / 2)

distance =
    2R × asin(√a)
```

For a small hackathon implementation, this can be implemented directly in a utility function.

---

# 9. Request Lifecycle

```text
             ┌─────────────┐
             │    OPEN     │
             └──────┬──────┘
                    │
                    ▼
          ┌──────────────────┐
          │    RESPONSES     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │     ACCEPTED     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │   IN PROGRESS    │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │    COMPLETED     │
          └──────────────────┘

OPEN ───────────────► CANCELLED
ACCEPTED ────────────► CANCELLED
```

Every status transition should be recorded.

Example:

```text
OPEN
  ↓
Helper responds
  ↓
Requester accepts
  ↓
ACCEPTED
  ↓
Help begins
  ↓
IN_PROGRESS
  ↓
Help finished
  ↓
COMPLETED
  ↓
Rating
```

---

# 10. Trust System

Trust should be calculated from multiple signals.

```text
Trust Score =
    40% Average Rating
  + 25% Completed Requests
  + 15% Verification
  + 10% Reliability
  + 10% Community Activity
```

The exact weights should remain configurable.

Trust should **assist matching but should not be presented as a guarantee that someone is safe or reliable**.

Users should be able to:

* View ratings.
* Report users.
* Block users.
* See verification status.
* View completed assistance count.

---

# 11. Communication Architecture

```text
Requester
    │
    ▼
Request
    │
    ▼
Helper Response
    │
    ▼
Conversation Created
    │
    ▼
Requester + Helper
    │
    ▼
Socket.IO
    │
    ▼
Real-time Messages
```

The platform should not require users to exchange phone numbers.

For example:

```text
Requester: "Can you help me move the table at 5 PM?"

Helper: "Yes, I can reach around 5 PM."
```

The conversation remains inside the platform.

---

# 12. API Structure

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/users/:id
PUT    /api/users/:id

POST   /api/requests
GET    /api/requests
GET    /api/requests/:id
PUT    /api/requests/:id
DELETE /api/requests/:id

POST   /api/requests/:id/respond
POST   /api/requests/:id/accept
POST   /api/requests/:id/cancel
POST   /api/requests/:id/complete

POST   /api/offers
GET    /api/offers

GET    /api/matches/:requestId

GET    /api/messages/:conversationId
POST   /api/messages

POST   /api/ratings
GET    /api/users/:id/ratings

GET    /api/directory
POST   /api/directory

GET    /api/activities
POST   /api/activities
POST   /api/activities/:id/join

GET    /api/notifications
PUT    /api/notifications/:id/read

POST   /api/reports
```

### Admin

```text
GET    /api/admin/reports
GET    /api/admin/users
PUT    /api/admin/users/:id/status

DELETE /api/admin/requests/:id
DELETE /api/admin/directory/:id
```

---

# 13. UI Architecture

| Screen          | Main Components                                     |
| --------------- | --------------------------------------------------- |
| Dashboard       | NearbyRequests, RecommendedHelpers, ActivitySummary |
| Discover        | Map, Filters, RequestCards                          |
| Create Request  | RequestForm                                         |
| Create Offer    | OfferForm                                           |
| Request Details | RequestInfo, MatchList, ResponseList                |
| Messages        | ConversationList, ChatWindow                        |
| Profile         | Skills, Rating, Verification, History               |
| My Requests     | Active, Completed, Cancelled                        |
| Help History    | Completed assistance                                |
| Directory       | ServiceSearch, ServiceCard                          |
| Activities      | ActivityList, ActivityDetails                       |
| Notifications   | NotificationList                                    |
| Admin           | UserManagement, Reports, Moderation                 |

### Mobile navigation

```text
┌─────────────────────────┐
│ Neighborhood Help       │
├─────────────────────────┤
│                         │
│     Main Content        │
│                         │
├─────────────────────────┤
│ Home │ Discover │ + │   │
│ Chat │ Profile         │
└─────────────────────────┘
```

The **+** button can provide quick actions:

```text
+ Create Help Request
+ Offer Help
+ Create Community Activity
```

---

# 14. Offline & Synchronization

The PWA should maintain a small local cache.

```text
                User Action
                    │
             ┌──────┴──────┐
             │             │
          Online        Offline
             │             │
             ▼             ▼
        Send to API     Save locally
             │             │
             ▼             ▼
          Database     Pending Queue
                           │
                      Connection Restored
                           │
                           ▼
                       Sync API
                           │
                           ▼
                     Mark Synced
```

Example:

```text
Offline:
Create "Need help carrying furniture"
        ↓
Saved as local draft
        ↓
Internet returns
        ↓
Sync request
        ↓
Server creates request
        ↓
Nearby helpers are matched
```

Conflicts should be handled using server timestamps and request IDs.

---

# 15. Security & Privacy

The platform handles location, user profiles and private communication.

## Rules

* Do not expose exact location publicly.
* Do not expose phone number/email unnecessarily.
* Use HTTPS.
* Hash passwords using a strong password-hashing algorithm.
* Secure authentication tokens.
* Validate all user input.
* Prevent unauthorized request modification.
* Rate-limit messaging and request creation.
* Allow users to report/block others.
* Allow users to delete their account.
* Minimize stored location history.
* Protect private messages.
* Prevent suspended users from creating new requests or offers.
* Use role-based authorization for administrators.
* Sanitize user-generated content.
* Do not store unnecessary sensitive information.

---

# 16. Performance Targets

| Operation                     |   Target |
| ----------------------------- | -------: |
| Dashboard load                |  < 2 sec |
| Request filtering             | < 100 ms |
| Match calculation             | < 500 ms |
| Nearby search                 | < 500 ms |
| Message delivery              |  < 1 sec |
| 500 nearby requests filtering | < 200 ms |

For the hackathon, these are target goals rather than strict requirements.

The main priority is that interactions feel responsive.

---

# 17. Testing Strategy

## Unit Tests

Test:

```text
Distance calculation
Location score
Skill score
Availability score
Trust score
Match score
Request status transitions
```

Examples:

```text
Closer helper
      ↓
Higher location score

Exact skill match
      ↓
Higher skill score

Higher rating
      ↓
Higher trust score

Unavailable helper
      ↓
Filtered out
```

## Integration Test

Test the complete flow:

```text
Create Request
      ↓
Find Matches
      ↓
Helper Responds
      ↓
Requester Accepts
      ↓
Message
      ↓
Complete
      ↓
Rate
```

## E2E Test

```text
Register
   ↓
Create Request
   ↓
View Recommended Helpers
   ↓
Accept Helper
   ↓
Chat
   ↓
Complete
   ↓
Rate
```

## PWA Tests

Test:

```text
Open application offline
View cached data
Create offline draft
Reconnect
Synchronize draft
```

## Security Tests

Test:

```text
Unauthorized request modification
Unauthorized messages
Invalid user IDs
Malicious input
Location privacy
Suspended user access
Admin-only endpoints
```

---

# 18. Hackathon MVP Architecture

For a **3 hour 45 minute hackathon**, do not attempt to implement every module fully.

The core vertical slice should be:

```text
                    USER
                     │
                     ▼
                Create Request
                     │
                     ▼
              Add Location
                     │
                     ▼
              Matching Engine
                     │
                     ▼
           Nearby Helper Suggestions
                     │
                     ▼
              Helper Responds
                     │
                     ▼
              Requester Accepts
                     │
                     ▼
                 Chat
                     │
                     ▼
                Complete
                     │
                     ▼
                  Rating
                     │
                     ▼
                Dashboard
```

### Implement fully

* Registration/login
* Profile
* Create help request
* Create help offer
* Location
* Nearby discovery
* Matching algorithm
* Match explanation
* Accept/respond
* Basic messaging
* Request status
* Rating
* Dashboard

### Implement as thin/seeded features

* Community directory
* Community activities
* Notifications
* Admin moderation
* Offline caching

### Leave for future

* Advanced AI matching
* Push notifications
* Complex verification
* Advanced fraud detection
* Large-scale geospatial optimization
* Full offline synchronization conflict resolution

This gives the project a strong **working end-to-end demo** instead of many unfinished screens.
