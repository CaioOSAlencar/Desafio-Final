# Cinema App Frontend

This is a modern React-based frontend for the Cinema App. **Currently in development** with backend API limitations affecting full functionality.

## ⚠️ Current Status: Limited Functionality

**Backend API Status (affects frontend functionality):**
- ✅ **Theater browsing**: Fully functional
- 🟡 **Movie catalog**: Read-only functionality works
- 🟡 **User authentication**: Basic login/register works
- 🔴 **Seat booking**: Backend reservations API not functional (~15% working)
- 🔴 **Session management**: Backend sessions API not implemented (~22% working)  
- 🔴 **Admin dashboard**: Backend user management completely broken (0% working)

> **Note**: Many features will show errors or limited functionality due to backend API issues. See backend documentation for detailed status.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [Deployment](#deployment)
- [Common Issues & Solutions](#common-issues--solutions)
- [Contributing](#contributing)

## ✨ Features (Current Implementation Status)

### ✅ Working Features
- **Theater Browsing**: View cinema locations and details (fully functional)
- **Movie Catalog**: Browse available movies (read-only)
- **Basic Authentication**: User registration and login

### 🟡 Partially Working Features  
- **User Profile**: Basic profile access (session management issues)
- **Movie Details**: View movie information (admin functions limited)

### 🔴 Known Non-Functional Features (Backend Issues)
- **Session Booking**: Seat selection and ticket purchase (reservations API broken)
- **Reservation Management**: Cannot view/manage bookings (API returns 404)
- **Admin Dashboard**: Management tools not accessible
  - ❌ User management (all routes return 404)
  - ❌ Session scheduling (routes not implemented)
  - ❌ Reservation management (API non-functional)
  - 🟡 Movie management (limited by auth issues)
  - ✅ Theater management (fully working)

## 💻 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **API Client**: Axios
- **Styling**: Styled Components and CSS
- **Icons**: React Icons
- **State Management**: React Context API

## 🗂️ Project Structure

```
cinema-app-frontend/
├── public/
│   └── index.html
├── src/
│   ├── api/                # API integration services
│   │   ├── auth.js         # Authentication API
│   │   ├── movies.js       # Movies API
│   │   ├── reservations.js # Reservations API
│   │   ├── sessions.js     # Movie sessions API
│   │   └── theaters.js     # Theaters API
│   ├── components/
│   │   ├── common/         # Shared components
│   │   │   ├── Alert/
│   │   │   ├── Footer/
│   │   │   └── Header/
│   │   └── movies/         # Movie-specific components
│   │       └── MovieCard/
│   ├── context/            # React Context providers
│   │   ├── AlertContext.js
│   │   └── AuthContext.js
│   ├── hooks/              # Custom React hooks
│   │   ├── useAlert.js
│   │   └── useAuth.js
│   ├── pages/              # Application pages
│   │   ├── Admin/          # Admin pages
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── MovieDetail/
│   │   └── ...
│   ├── styles/             # Global styles
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main application component
│   └── main.jsx           # Application entry point
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server
   ```bash
   npm start
   # or
   yarn start
   ```

## 📜 Available Scripts

- `npm start` or `yarn start`: Start the development server
- `npm run build` or `yarn build`: Build the app for production
- `npm run preview` or `yarn preview`: Preview the production build locally

## 🔌 API Integration Status

The application connects to a RESTful backend API with known limitations:

**Configuration:**
- Base URL: `/api/v1` (proxied to `http://localhost:3000/api/v1` in development)
- JWT Authentication: Basic implementation (session persistence issues)

**Service Status:**
- ✅ **Theaters API**: Fully functional (97.2% success rate)
- 🟡 **Movies API**: Read operations work (~75% functional)  
- 🟡 **Authentication API**: Basic login/register works (~60% functional)
- 🔴 **Sessions API**: Routes not implemented (~22% functional)
- 🔴 **Reservations API**: Core functionality broken (~15% functional)

> ⚠️ **Expected Errors**: Many API calls will return 404 or authentication errors. This is due to backend infrastructure issues, not frontend problems.

## 🔐 Authentication

The app uses JWT (JSON Web Tokens) for authentication:

- Tokens are stored in localStorage
- AuthContext provides authentication state throughout the application
- Protected routes redirect unauthenticated users to login
- Automatic token refresh mechanism for session persistence

## 👥 User Roles

The application supports multiple user roles:

1. **Guest Users**: Can browse movies and view details
2. **Registered Users**: Can book tickets and manage reservations
3. **Administrators**: Have access to the admin dashboard for full system management

## 📦 Deployment

To build the application for production:

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `dist/` directory, which can be deployed to any static hosting service.

## 🔧 Common Issues & Solutions

### API-Related Issues (Due to Backend Limitations)

**Most Common Issues You'll Encounter:**

1. **404 Errors on User Management**: All user-related operations will fail
   - **Cause**: Backend user routes not registered
   - **Solution**: Backend development needed, no frontend fix possible

2. **Reservation/Booking Failures**: Seat selection and booking won't work
   - **Cause**: Backend reservations API not functional
   - **Solution**: Use theater management as functional reference

3. **Session/Showtime Issues**: Movie sessions won't load
   - **Cause**: Backend sessions routes not implemented
   - **Solution**: Backend infrastructure needs completion

4. **Admin Dashboard Limitations**: Management features mostly non-functional
   - **Cause**: Multiple backend API issues
   - **Working Alternative**: Theater management is fully functional

### Development Issues

#### JSX in .js Files

If you encounter an error about JSX syntax not being enabled in `.js` files:

```
Error: The JSX syntax extension is not currently enabled
```

This is fixed by configuring Vite to properly process JSX in `.js` files. The project already includes this configuration in `vite.config.mjs`.

### Entry Module Resolution Issues

If you encounter build errors like:

```
Could not resolve entry module "index.html"
```

or the application doesn't display anything when running:

1. Ensure `index.html` is in the root directory (not in the public folder)
2. Make sure `vite.config.mjs` has the correct root and build configuration:
   ```javascript
   export default defineConfig({
     // ...other config
     root: './', // Set the root to the current directory where index.html is located
     build: {
       outDir: 'dist',
     },
   })
   ```

### Missing Component Errors

If you encounter errors like:

```
Could not resolve "./pages/SeatSelection" from "src/App.jsx"
```

This means some imported components don't exist. Either:
1. Create the missing components
2. Comment out the imports and routes for components that don't exist yet

### Vite CJS Node API Deprecated Warning

If you see the following warning:

```
The CJS build of Vite's Node API is deprecated.
```

This is addressed by:
1. Using the ESM version of the Vite config (`vite.config.mjs`)
2. Adding `"type": "module"` to package.json
3. Specifying the config file in npm scripts with `--config vite.config.mjs`

### Other Common Issues

1. **Module Not Found Errors** - Make sure all dependencies are installed by running:
   ```bash
   npm install
   # or
   yarn
   ```

2. **Port Already in Use** - If port 3000 is already in use, you can change it in `vite.config.mjs` or specify a different port:
   ```bash
   npm start -- --port 3001
   ```

3. **API Connection Issues** - Ensure your backend server is running at http://localhost:5000 or update the proxy configuration in `vite.config.mjs`

4. **Clean Build** - If you're experiencing strange build issues, try cleaning the build:
   ```bash
   npm run clean && npm run build
   ```

## 🎯 Testing the Frontend

### Manual Testing Recommendations

Given backend limitations, focus testing on working areas:

1. **Theater Management** (✅ Fully functional)
   - Browse theaters
   - Admin theater operations (if auth works)

2. **Movie Catalog** (🟡 Partially working)
   - Browse movies
   - View movie details
   - Basic search/filtering

3. **Authentication** (🟡 Basic functionality)
   - User registration
   - Login/logout
   - Profile access (may have session issues)

### Known Broken Areas (Don't Test)
- User management pages (404 errors)
- Reservation/booking flow (API broken)
- Session scheduling (not implemented)
- Advanced admin features (except theaters)

## 🔍 Backend Analysis

This frontend was tested against a comprehensive backend analysis:
- **258 integration tests** run against 6 backend modules
- **32 bugs identified** affecting frontend functionality
- **Detailed documentation** available in `/documentação/documentação de bugs/`

### Backend Status Summary
| Module | Status | Impact on Frontend |
|--------|--------|-------------------|  
| Theaters | ✅ 97.2% working | Full functionality |
| Movies | 🟡 ~75% working | Limited admin features |
| Auth | 🟡 ~60% working | Basic login works |
| Sessions | 🔴 21.6% working | Booking system broken |
| Reservations | 🔴 ~15% working | Core business logic failed |
| Users | 🔴 0% working | Admin dashboard broken |

## 🤝 Contributing

**For Frontend Development:**
1. Focus on UI/UX improvements for working features
2. Add error handling for known API failures  
3. Implement offline/fallback modes where possible
4. Test against working backend modules (theaters)

**For Full-Stack Development:**
1. Fix backend issues first (see backend documentation)
2. Test integration after backend fixes
3. Update this documentation as backend improves

**Development Workflow:**
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Test against working backend endpoints
4. Document any new API limitations discovered
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

*Last updated based on comprehensive backend API analysis - October 2024*
