# Home Expense Tracker

A comprehensive Next.js application for tracking personal expenses and incomes with automatic income distribution across expense categories.

## Features

- 🔐 **Flexible Authentication** - Sign in with Google OAuth or email/password (or both!)
- 🔑 **Password Freedom** - Set a password after Google sign-in, or skip it entirely
- 👥 **Role-Based Access** - Admin users can manage all users; regular users see only their data
- 💰 **Income Tracking** - Record and categorize income entries
- 💸 **Expense Tracking** - Track expenses by category
- 📊 **Automatic Distribution** - Income automatically distributed to expense categories based on percentage shares
- 📈 **Monthly Balances** - View balance statements for each expense category
- 🎯 **Category Management** - Create and manage income/expense categories
- 👤 **Multi-user Support** - Each user has isolated data

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MySQL with Prisma ORM
- **Validation**: Zod

## Database Schema

### Users
- id, firstName, lastName, email, phone, password

### Income Categories
- id, name, description, userId

### Incomes
- id, date, amount, categoryId, details, userId

### Expense Categories
- id, name, percentageShare, description, userId

### Expenses
- id, date, amount, categoryId, details, userId

### Monthly Balances
- id, monthYear, expenseCategoryId, openingBalance, totalDeposits, totalWithdrawals, closingBalance, userId

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL database
- npm or yarn package manager
- Google Cloud Console project (for OAuth)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd home_expense_tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Google OAuth**

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select existing one
   
   c. Enable Google+ API
   
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   
   e. Configure OAuth consent screen if not done
   
   f. Create OAuth client ID:
      - Application type: Web application
      - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
      - For production, add: `https://yourdomain.com/api/auth/callback/google`
   
   g. Copy the Client ID and Client Secret

4. **Set up environment variables**
   
   Create a `.env` file in the root directory (copy from `.env.example`):

   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/home_expense_tracker"
   NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

   To generate a secure `NEXTAUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

5. **Set up the database**
   
   Create the MySQL database:

   ```bash
   mysql -u root -p
   CREATE DATABASE home_expense_tracker;
   EXIT;
   ```

   Run Prisma migrations:

   ```bash
   npx prisma migrate dev --name init
   ```

   Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Create an Account

**Option 1: Google Sign-In (Recommended)**

- Click "Sign in with Google" on the login page
- Authorize the application with your Google account
- Your account is created automatically
- **Optional:** Set a password to also sign in with email/password later
  - You'll be prompted after first Google sign-in
  - Or add it anytime from Profile settings

**Option 2: Admin-Created Account**

- An admin creates your account through the admin panel
- You receive login credentials
- Sign in with email and password
- **Optional:** Link your Google account for faster sign-in next time

### 2. Set Up Categories

**Income Categories:**
- Go to "Categories" page
- Create categories like "Salary", "Freelance", "Business", etc.

**Expense Categories:**
- Create categories like "Savings", "Food", "Rent", "Entertainment", etc.
- Assign a percentage share to each category
- **Important:** Total percentage shares must equal 100%

### 3. Add Income

- Go to "Incomes" page
- Click "Add Income"
- Enter date, amount, select category, and add optional details
- Upon saving, the income will be automatically distributed to all expense categories based on their percentage shares
- Monthly balances are updated automatically

### 4. Record Expenses

- Go to "Expenses" page
- Click "Add Expense"
- Enter date, amount, select expense category, and add optional details
- Monthly balance for that category will be updated automatically

### 5. View Monthly Balances

- Go to "Balances" page
- Select a month to view
- See opening balance, deposits (from income distribution), withdrawals (expenses), and closing balance for each expense category

## How Income Distribution Works

When you add an income entry:

1. The system retrieves all your expense categories
2. Each category receives a portion of the income based on its percentage share
3. For example, if you earn $1,000:
   - Savings (40%) receives $400
   - Food (20%) receives $200
   - Rent (30%) receives $300
   - Entertainment (10%) receives $100

4. These amounts are added to each category's monthly balance as "deposits"
5. When you spend from a category, it's recorded as a "withdrawal"

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Categories
- `GET /api/income-categories` - Get all income categories
- `POST /api/income-categories` - Create income category
- `GET /api/expense-categories` - Get all expense categories
- `POST /api/expense-categories` - Create expense category

### Transactions
- `GET /api/incomes` - Get all incomes (with date filtering)
- `POST /api/incomes` - Create income (triggers distribution)
- `GET /api/expenses` - Get all expenses (with date filtering)
- `POST /api/expenses` - Create expense (updates balance)

### Balances
- `GET /api/monthly-balances?monthYear=YYYY-MM` - Get monthly balances

## Project Structure

```
home_expense_tracker/
├── app/
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── income-categories/  # Income category endpoints
│   │   ├── expense-categories/ # Expense category endpoints
│   │   ├── incomes/            # Income endpoints
│   │   ├── expenses/           # Expense endpoints
│   │   └── monthly-balances/   # Balance endpoints
│   ├── auth/                    # Auth pages (signin, register)
│   ├── dashboard/               # Dashboard pages
│   │   ├── categories/         # Category management
│   │   ├── incomes/            # Income management
│   │   ├── expenses/           # Expense management
│   │   ├── balances/           # Balance view
│   │   └── page.tsx            # Dashboard home
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (redirects)
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   ├── ProtectedRoute.tsx      # Auth wrapper
│   └── Providers.tsx           # Session provider
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client
│   └── income-distribution.ts  # Income distribution logic
├── prisma/
│   └── schema.prisma           # Database schema
├── types/
│   └── next-auth.d.ts          # NextAuth type definitions
├── .env.example                # Environment variables template
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript configuration
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name <migration-name>

# Reset database
npx prisma migrate reset
```

## Database Management

### View Data with Prisma Studio
```bash
npx prisma studio
```

### Create a New Migration
```bash
npx prisma migrate dev --name <descriptive-name>
```

### Reset Database (Warning: Deletes all data)
```bash
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb expense_tracker`

### Prisma Client Not Found
```bash
npx prisma generate
```

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Check `NEXTAUTH_URL` matches your application URL

### Percentage Share Validation
- Expense category percentage shares must total exactly 100%
- If income distribution fails, check category percentages

## Security Considerations

- Passwords are hashed using bcrypt
- Session-based authentication with JWT
- User data is isolated (userId filtering on all queries)
- Environment variables for sensitive configuration
- SQL injection protection via Prisma

## Future Enhancements

- Export data to CSV/PDF
- Budget planning and alerts
- Recurring income/expense entries
- Charts and visualizations
- Mobile responsive improvements
- Email notifications
- Multiple currencies support
- Shared household accounts

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
