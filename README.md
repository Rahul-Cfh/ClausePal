# LegalLens - AI Contract Analyzer

**The AI Copilot for Everyone Who Isn't a Lawyer**

LegalLens is an AI-powered contract analysis tool that helps non-lawyers understand complex legal documents in plain English. Upload any contract, and get instant insights on obligations, risks, red flags, and negotiation strategies.

## Features

### Quick Decision Dashboard
- **Contract Health Score**: Get an overall favorability score (0-100%) based on clause-by-clause analysis
- **Risk Assessment Matrix**: Visual representation of risk levels across all clauses
- **Playbook Deviation Scoring**: Compare contract clauses against your organization's legal playbook
- **At-a-Glance Metrics**: Total clauses analyzed, risk distribution, and average favorability scores

### Comprehensive Clause Analysis
- **Clause-by-Clause Breakdown**: Detailed analysis of each contract clause
- **Risk Identification**: Categorizes risks as Low, Medium, High, or Critical
- **Deviation Tracking**: Measures how much each clause deviates from your playbook standards
- **Issues & Red Flags**: Highlights problematic language and unacceptable positions
- **Questions for Counterparty**: Suggested clarifying questions to ask before signing
- **Mitigation Strategies**: Actionable steps to reduce risk
- **Recommended Edit Language**: Alternative clause language that's more favorable

### Negotiation Support
- **Counterargument Strategies**: Pre-built responses to common counterparty arguments
- **Strategy Types**: Soft pushback, risk framing, commercial tradeoffs, fallback positions, and escalation triggers
- **Negotiation Playbook**: Leverage your organization's standard responses

### Detailed Analytics
- **Your Obligations**: Clear breakdown of what you're committing to
- **Their Obligations**: What the other party is responsible for
- **Quantified Risks**: Risk level, likelihood, and potential damage assessment
- **Compliance Processes**: Step-by-step compliance requirements
- **Downloadable Reports**: Export analysis as text file for offline review

## Tech Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Integration**: OpenAI GPT-4 (via Vercel AI SDK)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Icons**: Lucide React
- **Form Handling**: React Hook Form, Zod validation

## Architecture

```
User uploads contract -> OpenAI GPT-4 analyzes text -> Supabase playbook comparison -> Risk scoring & visualization
```

The application uses a dual analysis approach:
1. **Quick Overview Mode**: General analysis for faster insights
2. **Playbook Comparison Mode**: Detailed clause-by-clause comparison against your legal playbook

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenAI API key with GPT-4 access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd legallens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase database**

   The application requires a `legal_playbook` table in your Supabase database. Run the migration:

   ```sql
   -- See supabase/migrations/20251212081249_create_legal_playbook_table.sql
   -- This creates the legal_playbook table with proper RLS policies
   ```

   Or apply the migration using Supabase CLI:
   ```bash
   supabase db push
   ```

5. **Seed your playbook (optional)**

   Add entries to your `legal_playbook` table to enable playbook comparison mode. Example:

   ```sql
   INSERT INTO legal_playbook (
     clause_title,
     ownership,
     standard_language,
     explanation,
     unacceptable_position,
     acceptable_level_of_deviation
   ) VALUES (
     'Indemnification',
     'Legal Team',
     'The Party shall indemnify...',
     'Standard mutual indemnification clause',
     'Unilateral indemnification only',
     'Minor wording changes acceptable'
   );
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Analyzing a Contract

1. Navigate to the **Analyze** page
2. Select the **Contract Type** (Rental, Job Offer, Freelance, NDA, SaaS, Other)
3. Choose your **Country or Region** for jurisdictional context
4. **Paste your contract text** into the text area
   - Currently supports plain text input
   - Remove any images or signatures before pasting
5. Click **"Explain this contract"**
6. Review the analysis results:
   - Quick Decision Dashboard (if playbook matches found)
   - Clause-by-Clause Analysis
   - Comprehensive breakdown of obligations, risks, and questions

### Understanding the Results

**Contract Health Score**
- **70-100%**: Strong position - generally favorable terms
- **50-69%**: Generally favorable - some clauses need review
- **30-49%**: Review recommended - several areas of concern
- **0-29%**: Significant concerns - multiple high-risk clauses

**Risk Levels**
- **Low**: Minor issues or standard language
- **Medium**: Requires attention, moderate risk
- **High**: Significant deviation or risk, needs negotiation
- **Critical**: Unacceptable position, must be changed

**Deviation Scoring**
- **Low**: Minor deviations from playbook
- **Medium**: Noticeable differences requiring review
- **High**: Major deviations needing negotiation
- **Unacceptable**: Positions that cannot be accepted as-is

### Downloading Results

Click the **"Download Results"** button to export the complete analysis as a text file, including:
- Contract metadata (type, country, date)
- Quick Decision Dashboard summary
- Full clause-by-clause breakdown
- Obligations, risks, and questions
- Disclaimer

## Project Structure

```
legallens/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── analyze/
│   │   └── page.tsx            # Contract analysis interface
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ClauseAnalysis.tsx       # Clause-by-clause analysis component
│   ├── QuickDecisionDashboard.tsx # Health score dashboard
│   └── ui/                      # shadcn/ui components
├── pages/api/
│   ├── analyze-contract.js      # OpenAI integration & playbook comparison
│   └── extract-pdf-text.ts      # PDF text extraction (future feature)
├── lib/
│   ├── supabase.ts              # Supabase client configuration
│   ├── pdfExtraction.ts         # PDF handling utilities
│   └── utils.ts                 # Utility functions
├── supabase/migrations/
│   └── 20251212081249_create_legal_playbook_table.sql
└── hooks/
    └── use-toast.ts             # Toast notifications
```

## Database Schema

### legal_playbook

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clause_title | text | Title of the clause |
| ownership | text | Department/team that owns this clause |
| standard_language | text | Standard contractual language |
| explanation | text | Detailed explanation of the clause |
| potential_edit_by_client | text | Common edits clients may request |
| unacceptable_position | text | Positions that cannot be accepted |
| acceptable_level_of_deviation | text | Acceptable deviations from standard |
| standard_response | text | Standard response to client requests |
| approving_authority | text | Who can approve changes |
| is_80_20 | text | Whether this is an 80-20 clause |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

**Row Level Security (RLS)**: Enabled with policies allowing authenticated users to read and insert playbook entries.

## Key Features Explained

### Playbook Comparison Mode

When you seed your `legal_playbook` table with your organization's standard clauses and policies, LegalLens will:

1. **Match contract clauses** to playbook entries
2. **Calculate deviation scores** based on how much the contract differs from your standards
3. **Identify unacceptable positions** that violate your policies
4. **Suggest mitigation strategies** aligned with your playbook
5. **Recommend alternative language** from your standard clauses

If no playbook entries exist, the system operates in **Quick Overview Mode**, providing general analysis without playbook comparison.

### AI Analysis Pipeline

1. **Text Processing**: Contract text is parsed and structured
2. **Clause Identification**: OpenAI identifies and extracts individual clauses
3. **Playbook Matching**: Clauses are matched against legal_playbook entries
4. **Risk Assessment**: Each clause is evaluated for risk level and favourability
5. **Deviation Scoring**: Differences from playbook are quantified
6. **Strategy Generation**: Negotiation strategies are created for high-risk clauses
7. **Comprehensive Report**: All findings are compiled into a structured analysis

### Technology Choices

- **Next.js**: Server-side rendering, API routes, and optimal performance
- **Supabase**: PostgreSQL database with built-in authentication and RLS
- **OpenAI GPT-4**: Advanced language understanding for legal document analysis
- **shadcn/ui**: Accessible, customizable UI components
- **Tailwind CSS**: Rapid styling with consistent design system

## Roadmap

### In Progress
- PDF upload support (currently text-only)
- Enhanced playbook matching algorithm
- Multi-language contract support

### Planned Features
- Contract templates library
- Version history and comparison
- Collaboration features for legal teams
- Integration with e-signature platforms
- Custom risk scoring rules
- Export to PDF/DOCX formats

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Disclaimer

**IMPORTANT**: LegalLens provides AI-generated contract analysis for informational purposes only. This tool does not provide legal advice and should not be relied upon as a substitute for consultation with a qualified legal professional. Always consult with a licensed attorney for important legal decisions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for GPT-4 API access
- Supabase for database and authentication infrastructure
- shadcn/ui for beautiful, accessible UI components
- Vercel AI SDK for seamless AI integration
- Built during a hackathon to democratize legal document understanding

---

**Made with care for everyone who's ever struggled to understand a contract**
