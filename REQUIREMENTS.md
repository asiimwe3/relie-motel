# Relief Motel — Requirements & Technical Stack

Companion to `PLAN.md` (90-day sprint) and `RESEARCH.md`. Everything needed to build and run the platform.

## 1. Human languages (8)

| Language | Purpose | Delivery |
|---|---|---|
| English | Default, global lingua franca | Native content |
| French | EU/Central Africa (DRC, Rwanda, Burundi, francophone tourists) | DeepL + human review |
| German | #1 EU safari market | DeepL + human review |
| Spanish | EU/LatAm growth | DeepL + human review |
| Italian | EU safari market | DeepL + human review |
| Chinese (Simplified) | growing Uganda tourist segment | DeepL + human review |
| Kiswahili | East Africa regional | Human translation |
| Luganda | Uganda domestic | Human translation |

- `hreflang` tags per language; language switcher with browser auto-detect.
- Staff-facing pages (dashboard) English only.

## 2. Programming languages & frameworks

| Layer | Technology |
|---|---|
| Website + admin dashboard | TypeScript + React (Next.js 15 App Router) |
| Styling | CSS/SCSS (design tokens), Tailwind CSS |
| Backend logic | TypeScript (Next.js Server Actions + Supabase Edge Functions, Deno TS) |
| Database | SQL (PostgreSQL via Supabase; RLS policies; Triggers) |
| Booking data model | PostgreSQL tables + constraints |
| Static site bits (week-1 landing page) | HTML/CSS/vanilla JS (zero-dependency, instant deploy) |
| Automation scripts | Python (content pipeline, translation QA, sitemap generation) |
| CI/CD | GitHub Actions (YAML) |

No other languages needed. Single-stack discipline keeps the retainer cheap.

## 3. APIs & integrations (the full list)

### Payments
1. **PesaPal API 3.0** — the ONE gateway. Accepts MTN MoMo, Airtel Money, Visa, Mastercard, AMEX; settles UGX and USD; handles both regional guests and international tourists. (Stripe is NOT available for Uganda-registered businesses — verified Oct 2026 — so PesaPal covers what Stripe would have done.)
2. Webhook listener for payment status → booking confirmation.

### Booking & communication
3. **WhatsApp Business Cloud API (Meta)** — booking confirmations, quick replies in 8 languages, catalog with rooms/rates, post-stay review requests.
4. **Africa's Talking (or Twilio)** — SMS confirmations for regional guests.
5. **Resend** (or SendGrid) — transactional email: booking confirmations, cancellation, pre-arrival info in guest's language.

### Maps & presence
6. **Google Maps Platform** — map embed, directions link, geocoding (site + Explore Fort Portal POIs).
7. **Google Business Profile API** — auto-posts, review monitoring, photo sync, Q&A.
8. **Google Places API** — live Google review widget on site.
9. **Bing IndexNow** — instant indexing of new/updated pages.

### Translation & localization
10. **DeepL API** (primary; best quality for FR/DE/ES/IT/ZH) + **Google Cloud Translation API** (fallback for SW/LG support).
11. **Open Exchange Rates / exchangerate-api** — daily USD/EUR/GBP/KES → UGX rates for the currency switcher (display only; settlement in UGX).

### Marketing & analytics
12. **Google Analytics 4 + Google Tag Manager** — conversion events (booking started/completed, WhatsApp click, call click, form submit).
13. **Meta Pixel + Conversions API** — retargeting.
14. **Google Ads** — campaign management (manual setup week 1; API optional later).
15. **Microsoft Clarity** — free heatmaps/session recordings.
16. **Tripadvisor widget** — embedded reviews.

### Platform services
17. **Supabase** — PostgreSQL (rooms, rates, availability, bookings, guests, reviews, menu, promo codes, admin users), Auth (staff logins, magic links), Storage (photos, virtual tour assets), Edge Functions (webhook handlers, currency cron), Realtime (dashboard availability updates).
18. **Vercel** — hosting + preview deploys; **Cloudflare** — DNS, CDN, SSL, email forwarding.
19. **Cloudflare Turnstile** — spam protection on forms.
20. **UptimeRobot** — uptime monitoring; **Sentry** — error tracking.
21. **Pannellum (open-source)** — 360° virtual tour (Matterport later if budget allows).

## 4. Functional requirements

1. Public site: Home, Rooms, Dining, Amenities, Gallery, Location, Explore Fort Portal, About, Contact, FAQ, Blog (2 posts/month), 8 languages, currency switcher.
2. Booking: availability calendar → 3-step checkout → payment (PesaPal) OR pay-at-hotel → email/WhatsApp/SMS confirmation → admin notification.
3. WhatsApp booking path: click-to-chat with prefilled message (room, dates); staff confirms in chat; dashboard manual booking entry.
4. Admin dashboard: bookings (list, calendar, manual create), rooms/rates/availability, gallery & menu management, promo codes, reviews & review-request queue, staff accounts with roles (Admin/Reception), audit log. Mobile-friendly for the 24/7 desk.
5. Review system: post-stay automatic request (email/WhatsApp), link to Google, dashboard tracking.
6. Blog CMS: markdown editing, per-language publishing, auto sitemap + IndexNow ping.
7. SEO: JSON-LD (Hotel/LodgingBusiness, Restaurant, FAQPage, BreadcrumbList, Review), sitemap, canonical, hreflang, OG/Twitter cards.

## 5. Non-functional requirements

1. Core Web Vitals: LCP < 2.0s, CLS < 0.05, INP < 200ms; Lighthouse 95+ mobile.
2. WCAG 2.2 AA accessibility.
3. GDPR: cookie consent, privacy policy, data export/delete on request (EU guests core market).
4. Uptime 99.9% (Vercel + Supabase SLAs), daily automated DB backups (Supabase).
5. Security: RLS on all tables, staff auth with MFA option, rate-limited public endpoints, secrets in env vars (never committed; `supabase-config.js` git-ignored per DeryCode standard).
6. PWA: installable, offline room/rates cache for low-connectivity Fort Portal conditions.

## 6. Accounts & signups needed (client + DeryCode checklist)

1. Domain reliefmotel.com (registrar of choice, ~UGX 80–100k/yr)
2. PesaPal business merchant account (owner's KYC documents required)
3. Meta WhatsApp Business + Business Manager (owner's phone number verification)
4. Africa's Talking account (Uganda sender ID approval)
5. Google: Search Console, Business Profile (claim existing listing), Analytics, Ads, Maps Platform API key, Business Profile API access
6. Bing Webmaster + IndexNow key
7. Supabase project + Vercel + Cloudflare accounts (DeryCode-managed)
8. DeepL API key, exchangerate-api key, Resend, Sentry, Clarity, UptimeRobot
9. Meta Pixel + Conversions API setup

## 7. What the owner must provide

1. Rates sheet (per room type, seasons) and cancellation policy
2. KYC for PesaPal merchant account
3. Access to existing Google Business Profile (or verification code postcard)
4. Access to Facebook page + WhatsApp number
5. Photo/video shoot access (rooms, restaurant, bar, exterior) — Day 3 target
6. Staff member as dashboard product owner
