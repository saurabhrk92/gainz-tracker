# 💪 Gainz Tracker

A beautiful, mobile-first Progressive Web App for tracking your weight lifting progress with advanced analytics and cloud sync.

## ✨ Features

- **📱 Mobile-First Design**: Beautiful glass morphism UI optimized for mobile devices
- **🏋️ Workout Tracking**: Track sets, reps, and weights with visual plate builder
- **📊 Progress Analytics**: Advanced charts and analytics to track your gains
- **📋 Workout Templates**: Create and manage reusable workout routines
- **⏱️ Built-in Timers**: Rest timer and workout timer with notifications
- **🔄 Progressive Overload**: Auto-fills previous workout data for easy progression
- **☁️ Cloud Sync**: Google Drive integration for backup and sync
- **📱 PWA**: Install as a native app on your phone
- **🎨 Beautiful UI**: Glass morphism design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account (for OAuth)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gainz-tracker.git
cd gainz-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Google OAuth credentials to `.env.local`:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3
- **Database**: IndexedDB (local storage)
- **Authentication**: NextAuth.js with Google OAuth
- **Cloud Storage**: Google Drive API
- **Charts**: Recharts
- **Animations**: Framer Motion
- **PWA**: next-pwa

## 📱 Key Features

### Visual Plate Builder
- Tap to add plates to barbell
- Visual representation of weight
- Auto-calculates total weight

### Progressive Overload Tracking
- Auto-fills previous workout data
- Shows last workout performance
- Easy weight progression

### Smart Auto-Progression
- Automatically advances to next exercise when target sets are complete
- Rest timer auto-starts between sets

### Comprehensive Analytics
- Weekly volume tracking
- Exercise progression charts
- Muscle group distribution
- Personal records tracking

## 🏗️ Project Structure

```
gainz-tracker/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── api/              # API routes
│   └── (pages)/          # App pages
├── lib/                   # Utility functions and services
│   ├── storage/          # IndexedDB service
│   ├── auth/             # Authentication config
│   └── types.ts          # TypeScript types
├── public/               # Static assets
└── styles/              # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and Tailwind CSS
- Icons from Emoji
- Inspired by the fitness community

---

**Note**: This is a personal project for tracking workouts. Always consult with a fitness professional for proper training guidance.
