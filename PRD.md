# PRD: ID.VUTERA.NET (IDENTITY SYSTEM)

## I. Product Overview

**1.1 Purpose**
`id.vutera.net` is the centralized Identity and Access Management (IAM) system for the Harmony AI ecosystem. It provides Single Sign-On (SSO) capabilities, ensuring that users have a seamless experience when moving between the Brand Hub, TuVi App, and MenhAn Sanctuary.

**1.2 Target Users**
- All users of the Harmony AI ecosystem.
- System administrators managing user access and profiles.

**1.3 Core Value Proposition**
- **Seamless Access**: One account for all services via `.vutera.net` domain cookies and JWTs.
- **Centralized Profile**: A single source of truth for user identity and birth data (essential for astrology calculations across apps).
- **Security**: Standardized authentication and authorization protocols across the ecosystem.

**1.4 Scope**
- **In-scope**:
  - User registration and authentication.
  - JWT issuance and verification for the `.vutera.net` domain.
  - Shared user profile management.
  - Profile API for other services to fetch user data.
- **Out-of-scope**:
  - Business logic for astrology (handled by `tuvi` and `menhan`).
  - Payment processing (handled by `menhan`).
  - Content management (handled by `harmony`).

---

## II. Functional Requirements

### 2.1 Authentication & Authorization
- **User Registration**: Users can create an account using Email and Password. Support for Social Login (OAuth2) to be implemented.
- **User Login**: Secure authentication returning a JWT and setting a secure cookie for the `.vutera.net` parent domain.
- **Session Management**: Token-based sessions with expiration and refresh mechanisms.
- **Logout**: Clear session cookies and invalidate tokens.

### 2.2 Profile Management
- **Profile Creation**: Automatically create a `Profile` entity upon `User` registration.
- **Profile Updates**: A user-facing page to update personal details:
  - Full Name
  - Birth Date
  - Birth Time (Sensitive)
  - Gender
  - Location
  - Energy Type (Calculated or user-assigned)
- **Data Privacy**: Strict access control; only the user and authorized system services can access sensitive birth data.

### 2.3 SSO & Ecosystem Integration
- **Cross-Domain Auth**: Use `.vutera.net` domain cookies to allow subdomains (`harmony`, `tuvi`, `menhan`) to identify the user.
- **Identity Provider (IdP)**: Act as the OIDC/OAuth2 provider for the ecosystem.
- **Shared Profile API**: Provide a secure endpoint (`/api/auth/me`) for other services to retrieve the authenticated user's profile.

---

## III. System Logic & API Contract

### 3.1 Data Model
- **User Table**:
  - `id`: UUID (PK)
  - `email`: String (Unique)
  - `passwordHash`: String
  - `ssoId`: String (Unique)
  - `createdAt`: DateTime
- **Profile Table**:
  - `userId`: UUID (FK to User)
  - `fullName`: String
  - `birthDate`: Date
  - `birthTime`: String (Encrypted AES-256)
  - `gender`: Enum (Male, Female, Other)
  - `location`: String
  - `energyType`: String (e.g., Metal, Wood, Water, Fire, Earth)

### 3.2 API Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|----------------|
| `/api/auth/register` | POST | Create a new user and profile | No |
| `/api/auth/login` | POST | Authenticate and set `.vutera.net` cookie | No |
| `/api/auth/logout` | POST | Clear session and cookies | Yes |
| `/api/auth/me` | GET | Fetch current user's identity and profile | Yes |
| `/api/auth/profile` | PUT | Update user profile information | Yes |

---

## IV. Non-Functional Requirements

**4.1 Security**
- **Encryption**: Sensitive data in the `Profile` table (specifically `birthTime`) must be encrypted using AES-256.
- **Transport**: HTTPS mandatory for all requests.
- **Cookies**: Cookies must be `HttpOnly`, `Secure`, and `SameSite=Lax`, scoped to `.vutera.net`.
- **JWT**: Use strong signing keys and short-lived access tokens.

**4.2 Performance & Availability**
- **Critical Path**: Since `id.vutera.net` is the entry point for all services, it must have the highest availability (99.9%+).
- **Response Time**: `/api/auth/me` should respond in < 100ms to avoid slowing down other apps.
- **Database**: Dedicated PostgreSQL instance to ensure identity services are not impacted by heavy queries in other apps.

**4.3 Scalability**
- Use Redis for session caching if the user base grows significantly.
- Implement rate limiting on `/login` and `/register` to prevent brute-force and bot attacks.

---

## V. User Flows

### 5.1 SSO Login Flow
1. User visits `menhan.vutera.net/private`.
2. MenhAn app checks for auth cookie/token $\rightarrow$ None found.
3. User is redirected to `id.vutera.net/login`.
4. User authenticates $\rightarrow$ `id.vutera.net` sets cookie for `.vutera.net` and redirects back to MenhAn.
5. MenhAn app detects cookie $\rightarrow$ Validates token $\rightarrow$ Grants access.

### 5.2 Profile Update Flow
1. User accesses `id.vutera.net/profile`.
2. User updates `birthTime` and saves.
3. System encrypts `birthTime` $\rightarrow$ Saves to DB.
4. Other services (like MenhAn) fetch updated data via `/api/auth/me` for new calculations.
