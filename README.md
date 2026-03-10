# OpenEvents

An open-source event management and ticketing platform built for [Streaming Tech Sweden 2026](https://events.apps.osaas.io). Built with Next.js, TypeScript, and deployed on [Eyevinn Open Source Cloud (OSC)](https://www.osaas.io/).

**Live site:** [events.apps.osaas.io](https://events.apps.osaas.io)

## Features

### Event Management
- Create, edit, and publish events with rich details
- Cover images and media uploads
- Event visibility controls (public/private)
- Event status workflow (draft, published, cancelled, completed)

### Ticketing & Sales
- Multiple ticket types with individual pricing and capacity
- Discount codes (percentage, fixed amount, free tickets)
- Group discounts for bulk purchases
- Invoice payment option for B2B customers
- Ticket reservation system during checkout
- Real-time availability tracking

### Speakers & Agenda
- Speaker profiles with photos, bios, and social links
- Drag-and-drop speaker ordering
- Agenda/schedule builder with time slots
- Speaker assignment to agenda items

### Payments
- Stripe integration for online payments
- Invoice billing for corporate customers
- Automated refund processing
- VAT handling (25% included)

### Attendee Management
- PDF tickets with QR codes
- QR code scanner for event check-in
- Attendee export to CSV/Excel
- Per-ticket attendee information

### Organizer Dashboard
- Sales statistics and revenue tracking
- 30-day sales trend charts
- Order management with filtering and search
- Bulk order actions and CSV export
- Ticket type and discount code management

### Admin Panel
- Platform-wide statistics
- User management with role assignment
- Create accounts with one-time passwords
- Event overview across all organizers

### Authentication
- Email/password with verification
- OAuth (Google, GitHub)
- Role-based access (Attendee, Organizer, Super Admin)
- Account deletion with grace period

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (on OSC)
- **Cache**: Valkey/Redis (on OSC)
- **Storage**: MinIO/S3 (on OSC)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Eyevinn Open Source Cloud

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Access to OSC services (or local PostgreSQL, Redis, MinIO)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Eyevinn/openevents.git
   cd openevents
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Generate Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@openevents.local | Admin123! |
| Organizer | organizer@openevents.local | Organizer123! |

## Project Structure

```
openevents/
├── prisma/                    # Database schema and migrations
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-email/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (public)/          # Public pages
│   │   │   ├── events/        # Event listing and details
│   │   │   │   └── [slug]/
│   │   │   │       └── checkout/
│   │   │   └── orders/        # Order confirmation
│   │   ├── (dashboard)/       # Organizer & admin dashboard
│   │   │   └── dashboard/
│   │   │       ├── events/    # Event management
│   │   │       │   ├── new/
│   │   │       │   └── [id]/
│   │   │       │       ├── edit/
│   │   │       │       ├── orders/
│   │   │       │       ├── tickets/
│   │   │       │       ├── discounts/
│   │   │       │       └── scan/
│   │   │       ├── admin/     # Super admin panel
│   │   │       │   └── users/
│   │   │       ├── profile/
│   │   │       ├── settings/
│   │   │       └── scan/      # Quick ticket scanner
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       ├── events/
│   │       │   └── [id]/
│   │       │       ├── speakers/
│   │       │       ├── agenda/
│   │       │       ├── ticket-types/
│   │       │       └── discount-codes/
│   │       ├── orders/
│   │       │   └── [id]/
│   │       │       ├── pay/
│   │       │       ├── capture/
│   │       │       ├── refund/
│   │       │       └── mark-paid/
│   │       ├── dashboard/
│   │       ├── admin/
│   │       ├── webhooks/
│   │       └── upload/
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── auth/              # Authentication
│   │   ├── events/            # Event display & editing
│   │   ├── tickets/           # Checkout & tickets
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── admin/             # Admin components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Shared libraries
│   │   ├── auth/              # Authentication utilities
│   │   ├── db/                # Prisma client
│   │   ├── email/             # Email service
│   │   ├── storage/           # S3/MinIO utilities
│   │   ├── payments/          # Stripe integration
│   │   ├── analytics/         # Dashboard analytics
│   │   └── validations/       # Zod schemas
│   └── types/                 # TypeScript types
├── docs/                      # Documentation
└── public/                    # Static assets
```

## Development

### Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (dev)
npm run db:push        # Push schema changes
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database
```

### Running Tests

```bash
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
```

### Linting

```bash
npm run lint
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - System design and infrastructure
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions
- [Email Setup](./docs/SETUP_EMAIL.md) - Email configuration
- [Storage Setup](./docs/SETUP_STORAGE.md) - MinIO/S3 configuration

## Deployment

This project is deployed on [Eyevinn Open Source Cloud (OSC)](https://www.osaas.io/). See [ARCHITECTURE.md](./ARCHITECTURE.md) for OSC service configuration.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
