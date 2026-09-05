# Denvia Online Market

Denvia Online Market (DOM) is a full-stack marketplace and business growth platform designed for African MSMEs, local sellers, service providers, and digital businesses. The platform helps businesses establish an online presence, manage storefronts, sell products, engage customers, run AI-assisted marketing, and operate a coordinated commerce workflow without compromising trust, safety, or operational clarity.

## Product vision

DOM exists to make it easier for businesses to:

- create a digital storefront and business profile
- showcase products and services
- manage orders, inventory, and fulfillment
- connect with customers through messaging and sales flows
- run AI-supported marketing campaigns
- track revenue, analytics, and provider readiness
- scale from demo-friendly operations to live commerce integrations

The platform is designed to support a progression from local discovery and marketing into full digital commerce:

Create → Showcase → Connect → Market → Sell → Measure

## Scope

The current solution includes:

- business registration and storefront management
- product and service catalog management
- customer discovery and search
- transactional marketplace foundation
- checkout and order lifecycle management
- delivery assignment and status tracking
- notifications and dashboard visibility
- AI marketing usage and campaign awareness
- provider readiness and adapter abstractions for payment/delivery integration
- analytics dashboards and business intelligence
- review and reputation features for trust-building

## Technology stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Persistence: MongoDB + Mongoose
- Authentication: JWT-based access tokens
- Security: Helmet, CORS, rate limiting, request logging
- AI features: keyword-driven seller assistant, usage tracking, marketing budgeting controls
- Provider strategy: demo/live mode abstraction layers for payment and delivery

## Repository structure

- `client/` — React frontend experience
- `server/` — Express API and domain logic
- `docs/` — supporting documentation
- `README.md` — project overview and SRS

## Local setup

### Prerequisites

- Node.js 20+
- npm
- MongoDB instance or Mongo Memory Server for tests
- Optional: Cloudinary credentials for media upload features

### Install dependencies

```bash
npm install
npm --prefix client install
npm --prefix server install
```

### Environment configuration

Create `server/.env` with values similar to:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/denvia
JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me
PAYMENT_PROVIDER_MODE=demo
DELIVERY_PROVIDER_MODE=demo
```

Optional live provider configuration:

```env
STRIPE_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=
COURIER_API_KEY=
```

Create `client/.env` if needed:

```env
VITE_API_URL=http://localhost:5000/api
```

### Run the app

```bash
npm run dev
```

This runs the server and client concurrently.

### Production build

```bash
npm run build
```

### Run tests

```bash
npm test
```

## Core system modules

### 1. Identity and access

- user registration and profile management
- JWT authentication
- role-aware flows for customers, sellers, admins, and staff
- password reset and account protections

### 2. Business management

- business profiles and storefront settings
- operating hours, contact data, and social links
- business discovery and public listing
- business moderation and publisher controls

### 3. Catalog and discovery

- products and services with pricing, media, and stock tracking
- category-based filtering and public search
- storefront browsing and listing APIs
- product reviews and average rating summaries for trust and conversion

### 4. Commerce and fulfillment

- cart creation and item management
- cart-to-order conversion
- checkout validation and order totals
- payment state tracking and webhook handling
- delivery assignment, courier tracking, and status transitions
- order lifecycle updates from pending to completed

### 5. Seller operations

- dashboard summary and revenue snapshot
- seller order management
- delivery assignment controls
- notification center
- AI marketing usage visibility
- provider readiness visibility

### 6. AI and marketing

- AI usage tracking and credit accounting
- content generation prompts and campaign planning support
- marketing insights dashboards
- usage caps and fairness controls

### 7. Analytics and insight

- sales trend analysis
- order and revenue time series
- platform growth views for sellers and admins
- engagement and operations reporting

### 8. Trust and customer confidence

- notifications for order and delivery updates
- product ratings and review summaries
- provider health status and warnings
- moderation-safe defaults and operational safeguards

## Software Requirements Specification (SRS)

### 1. Introduction

#### 1.1 Purpose

Denvia Online Market is a digital marketplace and business growth platform that enables businesses to establish an online presence, showcase and sell products, automate customer communication, and improve visibility through AI-supported marketing tools. The system is built for small and medium-sized enterprises, local sellers, and digital service providers operating primarily in Uganda and nearby markets.

#### 1.2 Vision

The platform aims to become a trusted digital ecosystem where businesses can:

- establish a professional identity
- discover and engage customers
- market products and services effectively
- convert interest into orders
- manage operations and delivery
- grow through analytics and customer trust

#### 1.3 Business drivers

- reduce the cost of digital business setup
- increase merchant discoverability and online reach
- provide conversion-ready commerce infrastructure
- support AI-powered marketing without requiring specialist skills
- create a trusted marketplace experience for local businesses and customers

### 2. User roles

#### 2.0 Account model (read this first)

DOM uses **one user identity** with two independent dimensions, so this
is worth understanding before reading the role sections below:

| Dimension | Values | What it governs |
|---|---|---|
| **Account capability** (`accountTypes`) | `customer`, `business` | What a user *can use* on the platform. A user can hold both at once — becoming a seller never removes customer capability, and there is no second account. |
| **Authorization role** (`role`) | `user`, `business_owner`, `business_staff`, `admin` | What a user *is allowed to do*, enforced by backend middleware on every request. |

A customer becomes a seller via **"Start selling on DOM"** (or by
creating their first business), which adds the `business` capability
and elevates their role to `business_owner` — same login, same
account, no re-registration.

Guest shoppers are the exception: **an account is never required to
browse or buy.** See FR-005 and FR-015 below.

#### 2.1 Customer

Shopping does **not** require an account. A guest can do everything
below except items marked *(account only)*:

- browse businesses and products
- search and filter listings
- add products to cart (persists across guest sessions)
- verify a phone number by OTP and place an order
- track an order via a secure reference + tracking link
- read product reviews and leave feedback
- receive order notifications via SMS/WhatsApp/email
- *(account only)* view order history in one place, save delivery
  details, receive in-app notifications

#### 2.2 Business owner / seller

A business owner can:

- manage a business profile and storefront (branding, contact,
  business hours, social links)
- invite staff and control which staff receive order/feedback
  notifications
- add products and services
- update prices, stock, and media
- monitor order flow and fulfillment
- assign delivery providers and track shipments
- review analytics and revenue reports
- run AI-driven marketing actions
- receive an in-app notification for every new order and new
  customer feedback

#### 2.3 Platform admin

An admin can:

- moderate businesses and listings
- manage categories and platform content
- review platform health and provider states
- audit usage and operational issues
- maintain growth and quality standards

### 3. Functional requirements

#### FR-001: User account management

The system shall allow users to create, activate, and manage account profiles with secure authentication and role-based access.

#### FR-002: Business profile management

The system shall allow a verified business owner to create and maintain a business profile with branding, operating hours, contact information, and public storefront settings.

#### FR-003: Product and service management

The system shall allow a business owner to create, edit, publish, and archive products and services with pricing, inventory, media, and category assignment.

#### FR-004: Public discovery and search

The system shall support public discovery of products and businesses through keyword search, category filters, sorting, and basic analytics-friendly listing responses.

#### FR-005: Cart and checkout ✅

The system shall allow both guests and authenticated customers to add
items to a cart, validate totals, and complete checkout. A guest cart
persists locally and merges into the account cart on login/register
without data loss. Login or registration is never required to
complete a purchase.

#### FR-006: Order lifecycle management ✅

The system shall track each order through a structured lifecycle including pending, paid, confirmed, packed, shipped, delivered, or cancelled states. Every order receives a unique, human-readable reference (`DOM-XXXXXXXX`). An order may exist without a registered `userId` (guest order) while retaining the contact snapshot needed to fulfill and communicate about it.

#### FR-007: Payment abstraction

The system shall support a provider abstraction that accommodates demo and live payment providers without breaking the core checkout flow.

#### FR-008: Delivery and fulfillment

The system shall support delivery assignment, tracking code capture, and lifecycle progression for in-transit and delivered states.

#### FR-009: Notifications ✅

The system shall create, store, and present status-driven notifications for order updates, delivery progress, new orders, and new customer feedback. Recipients are resolved by business ownership and staff membership: a business owner and their opted-in staff are notified of events on their own business only, never another business's events. Notification delivery failure must never fail the underlying order or feedback action. Customers may opt SMS/WhatsApp/email channels in or out; in-app notifications for account holders cannot be disabled since they carry required order information.

#### FR-010: AI marketing and credits

The system shall record AI usage, assign credit budgets, and expose marketing readiness and consumption to business owners.

#### FR-011: Analytics

The system shall provide time-series and aggregate analytics for orders, revenue, and usage patterns to support seller decision making.

#### FR-012: Reviews and trust

The system shall allow verified and customer-generated product reviews and aggregate rating data to improve trust, discoverability, and conversion quality.

#### FR-013: Provider readiness

The system shall expose which payment and delivery providers are ready, configured, or still in demo-only mode to support safe rollout.

#### FR-014: Platform administration

The system shall provide admin visibility into key system state, moderation tools, and operational health indicators.

#### FR-015: Guest identity and phone verification ✅

The system shall verify a guest's phone number via a server-generated, hashed, time-limited OTP before allowing order placement. The client never asserts its own verification state — the server issues a signed, short-lived verification token only after successful OTP verification, and order creation validates that token rather than trusting a client-supplied flag. A verified guest may look up their own order using the order reference together with a secure tracking token; the reference alone is never sufficient to reveal order details.

#### FR-016: Business staff and notification permissions ✅

The system shall allow a business owner to invite existing platform users as staff (`manager` or `staff`) scoped to a single business, without creating a second account for that user. Staff gain business-context access only after accepting their invite. An owner may revoke an individual staff member's ability to receive order/feedback notifications independently of their business access.

### 4. Non-functional requirements

#### NFR-01: Security

The system shall use secure session/token handling, strict input validation, rate limiting, and environment-driven configuration to reduce exposure to unsafe traffic and misconfiguration. Guest-accessible endpoints (checkout quote, order creation, OTP request/verify) are rate-limited independently of the global limiter. No client-supplied claim (price, stock, verification status, ownership, or role) is ever trusted without a matching server-side check.

#### NFR-02: Reliability

The application shall degrade gracefully when optional external systems are unavailable, prioritizing local demo-safe workflows while keeping live provider readiness visible.

#### NFR-03: Performance

The platform shall use pagination, efficient filters, and lean response payloads to keep storefront and dashboard operations responsive.

#### NFR-04: Extensibility

The platform shall support adapters and provider seams so new payment or delivery providers can be added with minimal disruption to the business logic.

#### NFR-05: Observability

The platform shall emit request logs, system health signals, and clear operational status indicators useful for sellers and administrators.

### 5. Data model principles

The system organizes data around the following domains:

- users and roles
- businesses and storefronts
- products and categories
- services and offerings
- orders, carts, and payments
- delivery status and tracking events
- notifications and messaging
- AI usage and marketing plans
- platform provider readiness
- product reviews and trust signals

### 6. Roadmap and maturity plan

#### MVP / current phase

- guest and account-based shopping, unified under one user identity
- business profiles, catalog management, and staff/permissions
- search and discovery
- marketplace cart and orders, including guest checkout with OTP verification
- delivery lifecycle basics
- notifications (in-app, business/staff-aware) and analytics
- AI usage overview
- provider mode readiness notes (payment, delivery, SMS — all demo-safe by default)
- review system for trust-building, with business notification on new feedback

#### Growth phase

- live payment provider integration
- courier API integration
- inventory forecasting
- subscription-based seller plans
- richer marketing workflows and campaign automation
- customer retention and referral tracking

#### Enterprise phase

- multi-tenant admin controls
- audit log and compliance exports
- team roles and permissions
- warehouse and logistics orchestration
- advanced reporting and performance dashboards

## Recommended next enhancements

To keep the system competitive and production-ready, the next best improvements are:

1. live payment gateway integration with Stripe or Flutterwave
2. real SMS/WhatsApp provider integration (currently demo-mode by design) to complete OTP delivery and multi-channel order notifications
3. real courier API integration and fulfillment orchestration
4. richer messaging and customer support workflow
5. review moderation and spam protections
6. referral and rewards engine
7. subscription and billing upgrades for sellers
8. deeper AI campaign automation for content and ads
9. exportable analytics reports and business insights

## Validation status

The current project already demonstrates a stable marketplace MVP with seller dashboards, order management, fulfillment orchestration, AI marketing visibility, and provider readiness signals. Guest checkout, phone OTP verification, and business/staff-aware notifications are implemented end-to-end (server + client) and covered by the account-model rules in §2.0. The codebase remains intentionally demo-safe for external integrations (payment, delivery, SMS) while preserving the architecture needed to move into real provider connectivity and higher-scale operations.
