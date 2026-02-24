# Overview

InBack/Clickback is a Flask-based real estate platform focused on cashback services for new construction properties in the Krasnodar region, with plans for expansion. It aims to connect buyers and developers, streamline property transactions, and integrate CRM functionalities. Key features include cashback incentives, intuitive property search with interactive maps, complex comparisons, and a manager dashboard for tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

**Design Preferences:**
- Brand color: rgb(0 136 204) = #0088CC - consistently applied across entire dashboard
- No purple/violet/fuchsia colors in UI

# System Architecture

## Frontend

The frontend utilizes server-side rendered HTML with Jinja2 and CDN-based TailwindCSS for a mobile-first, responsive design. Interactivity is provided by modular vanilla JavaScript, enabling features like smart search, real-time filtering, Yandex Maps integration, property comparison, and PDF generation. UI/UX emphasizes AJAX-powered sorting/filtering, interactive map pages, mobile-optimized search, and a consistent application of the brand color #0088CC, avoiding purple/violet/fuchsia tones.

**Key UI Features:**
- **Fullscreen Map:** Dynamic clustering, city-filtered property display, 2-column desktop layout (cards + map), real-time marker updates, quick room filters, multi-city support, marker highlighting on card hover, and area drawing functionality for filtering properties within a custom polygon.
- **Responsive Layouts:** Property cards utilize a responsive grid (1, 2, or 3 columns based on viewport).
- **Unified Width Alignment:** `max-w-7xl mx-auto` for consistent, centered content across all sections.
- **Active Filters Display:** Visual indicator for applied filters with clickable chips for clearing.
- **Filter Synchronization:** Complete bi-directional filter sync between map view and list view using URL parameters. All map filters (rooms, price, area, floor, developers, districts, completion status, object classes, building status, features, renovation, floor options, etc.) are saved to URL and auto-applied when page loads.
- **Hybrid Filter System:** Early wrapper functions detect context (modal map vs list view) and route appropriately - AJAX for modal map (no page reload), URL parameters for list view (server-side filtering).
- **Dashboard Mobile Adaptation:** Mobile-specific bottom nav (Главная, Избранное, Сделки, Подборки) replaces global nav; fullscreen slide-in modals for notifications and profile (with tabs: Профиль/Баланс/Настройки); mobile top bar with notification bell and avatar; desktop tab bar hidden on mobile via `#dashboard-tab-nav`; z-index hierarchy: dash modals z-10010 > phone/map modals z-10000 > mobile menu z-10000 > dash bottom nav z-9998.
- **Comprehensive Manager Pages Mobile Adaptation:** All manager pages (kanban, calendar, deal card, employees, deals archive, presentation view) fully adapted for mobile with: unified bottom navigation (5 tabs: Главная, Канбан, Календарь, Сделки, Клиенты); compact mobile top bars with brand-colored (#0088CC) back buttons replacing desktop headers; desktop headers/tab navs hidden on mobile via CSS classes (`.calendar-top-header`, `.kanban-top-header`, `.deal-card-top-header`, `.archive-top-header`, `.kanban-tab-section`, `.calendar-tab-nav`); swipeable kanban columns (85vw snap-scroll); swipeable deal stage pipeline with touch scrolling; card-based views replacing tables on mobile (deals archive); fullscreen modals (inset: 0); compact stat cards; safe-area-inset-bottom padding for bottom nav.

## Backend

The backend is built with Flask, following an MVC pattern with blueprints and SQLAlchemy/PostgreSQL. It uses Flask-Login for session management and RBAC (Regular Users, Managers, Admins). Features include phone verification via SMS, multi-city data management, and an intelligent automatic detection system for sold properties.

**Core Systems:**
- **Intelligent Address Parsing & Multi-City Smart Search:** Leverages DaData.ru and Yandex Maps Geocoder for address normalization, geocoding, and city-aware search suggestions covering cities, residential complexes, districts, and streets.
- **Balance Management System:** Production-ready system with `UserBalance`, `BalanceTransaction`, and `WithdrawalRequest` models, supporting cashback and withdrawals with Decimal precision.
- **Comprehensive SEO Optimization:** Multi-city SEO features including Canonical URLs, City-Aware Meta Tags, JSON-LD, sitemaps, robots.txt, and HSTS. **City-prefixed SEO routes** use Russian transliterated slugs as primary URLs (`/<city_slug>/kvartiry`, `/<city_slug>/semejnaya-ipoteka`, `/<city_slug>/nalogovyj-vychet`, etc.). English slugs (e.g., `/sochi/tax-deduction`) are 301-redirected to Russian equivalents via `ENGLISH_TO_RUSSIAN_CITY_SLUGS` dict in `@app.before_request`. City homepage available at `/<city_slug>/`. Non-city URLs 301-redirect to city-prefixed versions using `redirect_to_city_based()` from `seo_redirects.py`. Complex pages (blog, map, streets) use helper functions (`_render_blog_page`, `_render_map_page`, `_render_streets_page`).
- **Parser Integration System:** Universal `ParserImportService` for automated data import from external sources, handling property hierarchies and generating SEO-friendly slugs.
    - **Admin Device Tracking:** Managers and Buyers' last login IP and User Agent are tracked and visible in the admin edit pages for security monitoring.
- **District & Neighborhood System:** Hierarchical catalog of districts and neighborhoods with API support for city-specific filtering.
- **Deal Card CRM System:** Bitrix24-style deal management with configurable pipeline stages (admin-managed via `DealStageConfig` model), activity feed with timestamped comments and history, tasks with priorities/due dates, inline field editing (price, cashback, property details), automatic audit logging, and task reminder notifications. Completed/rejected deals are locked (read-only) with closing info banners (rejection reason + comment). Deal closing modal offers "Успешна"/"Проиграна" choice; rejected deals require reason selection from predefined list + optional comment. Stage transitions prompt inline task creation (title, date, priority). Models: `Deal` (with `rejection_reason`, `closing_comment`, `closed_at`), `DealComment`, `DealTask`, `DealHistory`, `DealStageConfig`. Templates: `templates/manager/deal_card.html`, `templates/admin/deal_stages.html`.
- **Deals Kanban Board:** Visual pipeline view showing deals grouped by stage columns with counts, client info, pricing, and task badges. Includes embedded calendar tab (FullCalendar) alongside Kanban/List/Tasks views - all switching is client-side via JS `switchView()`. URL param `?view=calendar|list|tasks` supported. Template: `templates/manager/deals_kanban.html`. Route: `/manager/kanban`.
- **Deals Archive:** Closed deals (completed + rejected) with statistics (conversion rate, revenue, cashback, avg deal), rejection reasons breakdown, manager comparison table. Accessible to managers (own deals), РОП/is_rop (all deals with manager filter), and admins. Templates: `templates/manager/deals_archive.html`, `templates/admin/deals_archive.html`. Routes: `/manager/deals-archive`, `/admin/deals-archive`.
- **Task Calendar:** FullCalendar-based monthly/weekly view of deal tasks color-coded by status (active/overdue/completed/high-priority). Now embedded as a tab in the Kanban page (no page reload). Standalone page still available at `/manager/calendar` but tab links redirect to kanban. Template: `templates/manager/tasks_calendar.html`. Route: `/manager/calendar`.
- **РОП Role (Head of Sales):** Manager model has `is_rop` boolean field. РОП users can view all managers' deals in the archive, filter by manager, and see comparative statistics.
- **Organizational Structure:** Hierarchical department system with roles and permissions. Admin-managed via `/admin/org-tree`. Models: `Department` (with parent hierarchy, head manager), `OrgRole` (with granular permissions for deals, archives, responsible changes, statistics, lead reception). Default roles: Директор (all access), РОП (department access), Менеджер (own access only). Managers are assigned to departments and roles by admin. Permissions control: deal visibility (all/department/own), archive access, deal responsible reassignment, statistics viewing, lead reception (`can_receive_leads`). Route: `/admin/org-tree`. API: `/admin/api/departments`, `/admin/api/roles`, `/admin/api/roles/<id>` (GET), `/admin/api/managers/assign`, `/api/deals/{id}/reassign`.
- **Automatic Lead Assignment:** Website form submissions (callback, booking, etc.) create Deals automatically via `create_deal_from_website_form()`. Manager assignment uses round-robin among managers whose OrgRole has `can_receive_leads=True`, selecting the manager with fewest existing leads. Falls back to first active manager if no lead-receiving roles configured. Quiz data (district, interest, rooms, budget, timing) from forms is saved to User model fields.
- **Buyer Referral Program:** Each buyer gets an auto-generated 8-char alphanumeric referral code (`User.referral_code`). Referral link format: `/login?ref=CODE` (captured on both `/login` and `/register` pages). When a new user registers via referral link, the referrer receives 20,000₽ bonus credited to their balance immediately. Model: `Referral` (referrer_id, referred_id, bonus_amount, status, bonus_credited_at). Standalone partner cabinet page at `/partner` with full stats, referral link, share buttons, invitations list, and program conditions. Dashboard sidebar links to `/partner`. API: `/api/user/referrals` (GET). Referral code is case-insensitive (normalized to uppercase). Duplicate referral prevention via unique constraint on `referred_id`. Template: `templates/auth/partner_cabinet.html`.
- **Partner/Affiliate System (MLM):** Separate user type `Partner` (like Manager/Admin) with independent registration, login, and dashboard. Partners earn bonuses by inviting other partners via referral links. Multi-level tracking: Level 1 (direct referral) = 20,000₽ bonus, Level 2 (referral of referral) = 5,000₽ bonus. Models: `Partner` (partner_id PRT12345678 format, referral_code, referred_by_id self-referential FK, level, balance, total_earned, total_withdrawn, total_referrals), `PartnerReferral` (partner_id, referred_partner_id, referred_user_id, bonus_amount, status, level), `PartnerWithdrawal` (partner_id, amount, status, payment_method, payment_details, admin_comment). Auth: Phone + SMS verification for registration, phone/email + password for login. Flask-Login integration via `p_` prefix on partner IDs. Routes: `/partner/login`, `/partner/register`, `/partner/register/send-code`, `/partner/register/verify-code`, `/partner/register/complete`, `/partner/logout`, `/partner/dashboard`. API: `/partner/api/stats`, `/partner/api/referrals`, `/partner/api/withdrawal`, `/partner/api/withdrawals`, `/partner/api/structure`. Templates: `templates/partner/login.html` (login+register tabs), `templates/partner/dashboard.html` (stats, referral link, referrals table, withdrawals, MLM structure tree, conditions). Withdrawal minimum: 1,000₽, one pending request at a time.

## Data Storage

PostgreSQL, managed via SQLAlchemy, stores Users, Managers, Partners, Properties, Residential Complexes, Developers, Marketing Materials, transactional records, and search analytics.

## Authentication & Authorization

A Flask-Login based system supports Regular Users, Managers, Partners, and Admins. Regular user login is exclusively via phone number + SMS verification. Partner login uses phone/email + password. The system includes streamlined registration, temporary password generation via SMS, and mandatory profile completion. All authentication is secured with CSRF tokens, rate limiting, and code expiration. User types are distinguished by ID prefix: no prefix (User), `m_` (Manager), `p_` (Partner), `a_` (Admin).

# External Dependencies

## Third-Party APIs

-   **SendGrid**: Email services.
-   **OpenAI**: Smart search and content generation.
-   **Telegram Bot API**: Notifications and communication.
-   **Yandex Maps API**: Interactive maps, geocoding.
-   **DaData.ru**: Address normalization and suggestions.
-   **RED SMS**: Russian SMS service for phone verification.
-   **Google Analytics**: User behavior tracking.
-   **LaunchDarkly**: Feature flagging.
-   **Chaport**: Chat widget.
-   **reCAPTCHA**: Spam and bot prevention.
-   **ipwho.is**: IP-based city detection.

## Web Scraping Infrastructure

-   `selenium`, `playwright`, `beautifulsoup4`, `undetected-chromedriver`: Automated data collection.

## PDF Generation

-   `weasyprint`, `reportlab`: Generating property documents and reports.

## Image Processing

-   `Pillow`: Image resizing, compression, WebP conversion, QR code generation.