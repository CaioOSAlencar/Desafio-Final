# Cinema App API

A RESTful API for a cinema ticket booking system built with Node.js, Express, and MongoDB.

## ⚠️ Current Status: In Development

**This API is under active development and NOT production-ready.** 

Based on comprehensive integration testing (258 test cases across 6 modules), current functionality status:

### ✅ Fully Functional (97.2% success rate)
- **Theater Management** - All CRUD operations working
- Basic theater operations, capacity management, validation

### 🟡 Partially Functional (~60-75% success rate)  
- **Movie Management** - Read operations work, admin operations limited
- **Authentication** - Basic login/register work, session management issues
- **User Registration** - Core functionality works, validation gaps

### 🔴 Critical Issues (<25% success rate)
- **User Management** - All admin routes return 404 (routes not registered)
- **Session Management** - Most routes return 404 (infrastructure missing) 
- **Reservation System** - Core booking functionality not accessible
- **Admin Authorization** - Inconsistent across modules

> 📊 **Overall System Health**: ~45% functional | **32 bugs identified** | See `/tests/integration/` for detailed analysis

## Features (Implementation Status)

- ✅ **Theater management** (fully working)
- 🟡 **Movie catalog** (read-only functional)
- 🟡 **User authentication** (basic functionality)
- 🔴 **Session scheduling** (routes not implemented)
- 🔴 **Seat reservation system** (not functional)
- 🔴 **Admin dashboard** (user management broken)

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication mechanism
- **bcryptjs** - Password hashing

## Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Docker (optional, for MongoDB container)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cinema-app
```

## Running the Application

### Quick Start with Docker
```bash
# Start MongoDB container
docker run -d --name cinema-mongodb -p 27017:27017 mongo:7.0

# Install dependencies and start server
npm install
npm run dev
```

### Development Mode
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

### Database Setup
```bash
# Seed with sample data
npm run seed

# Alternative seeding scripts
node src/utils/seedData.js
node src/utils/seedMoreMovies.js
node src/utils/seedSessions.js
```

### Testing and Quality Assurance
```bash
# Run integration tests (identifies current issues)
npm run test:integration

# Run specific module tests
npm test -- --testPathPattern=theaterRoutes.test.js  # ✅ Should pass ~97%
npm test -- --testPathPattern=movieRoutes.test.js    # 🟡 ~75% pass  
npm test -- --testPathPattern=authRoutes.test.js     # 🟡 ~60% pass
npm test -- --testPathPattern=userRoutes.test.js     # 🔴 0% pass
npm test -- --testPathPattern=sessionRoutes.test.js  # 🔴 ~22% pass
npm test -- --testPathPattern=reservationRoutes.test.js # 🔴 ~15% pass

# Generate bug documentation
# Results automatically documented in /tests/integration/
```

## API Endpoints Status

> ⚠️ **Status Legend**: ✅ Working | 🟡 Partial | 🔴 Broken/404 | 📝 Planned

### Authentication (🟡 Partially Working)
- ✅ `POST /api/v1/auth/register` - Register a new user  
- ✅ `POST /api/v1/auth/login` - Login
- 🟡 `GET /api/v1/auth/me` - Get current user profile (token issues)

### Users (🔴 Not Working - All routes return 404)
- 🔴 `GET /api/v1/users` - Get all users (admin only)
- 🔴 `GET /api/v1/users/:id` - Get user by ID (admin only)  
- 🔴 `PUT /api/v1/users/:id` - Update user (admin only)
- 🔴 `DELETE /api/v1/users/:id` - Delete user (admin only)

### Movies (🟡 Partially Working)
- ✅ `GET /api/v1/movies` - Get all movies
- ✅ `GET /api/v1/movies/:id` - Get movie details
- 🟡 `POST /api/v1/movies` - Create movie (auth issues)
- 🟡 `PUT /api/v1/movies/:id` - Update movie (auth issues)
- 🟡 `DELETE /api/v1/movies/:id` - Delete movie (auth issues)

### Theaters (✅ Fully Working - 97.2% success rate)
- ✅ `GET /api/v1/theaters` - Get all theaters
- ✅ `GET /api/v1/theaters/:id` - Get theater details
- ✅ `POST /api/v1/theaters` - Create theater (admin only)
- ✅ `PUT /api/v1/theaters/:id` - Update theater (admin only)
- ✅ `DELETE /api/v1/theaters/:id` - Delete theater (admin only)

### Sessions (🔴 Critical Issues - Routes not implemented)
- 🔴 `GET /api/v1/sessions` - Get all sessions
- 🔴 `GET /api/v1/sessions/:id` - Get session details
- 🔴 `POST /api/v1/sessions` - Create session (admin only)
- 🔴 `PUT /api/v1/sessions/:id` - Update session (admin only)
- 🔴 `DELETE /api/v1/sessions/:id` - Delete session (admin only)

### Reservations (🔴 Not Functional - Routes not accessible)
- 🔴 `GET /api/v1/reservations` - Get all reservations (admin only)
- 🔴 `GET /api/v1/reservations/me` - Get current user's reservations  
- 🔴 `GET /api/v1/reservations/:id` - Get reservation details
- 🔴 `POST /api/v1/reservations` - Create reservation
- 🔴 `PUT /api/v1/reservations/:id` - Update reservation (admin only)
- 🔴 `DELETE /api/v1/reservations/:id` - Delete reservation (admin only)

### 📊 API Health Summary
- **Working Endpoints**: ~30% (mainly theaters + basic movies)
- **Partially Working**: ~20% (auth + movie reads)  
- **Broken/404**: ~50% (users, sessions, reservations)

> 📋 **Detailed Analysis**: See `/tests/integration/` and `/documentação/documentação de bugs/` for comprehensive bug reports

## Sample Users

After seeding the database, you can use these accounts to test the **working** endpoints:

- Admin: admin@example.com / password123  
- User: user@example.com / password123

> ⚠️ **Note**: User management endpoints are currently broken (404), so these accounts are only useful for authentication and theater operations.

## Known Issues & Workarounds

### Critical Issues
1. **User Management Routes 404**: All `/users/*` endpoints return 404
   - **Workaround**: Use direct database operations for user management
   
2. **Reservation System Non-functional**: Core business logic inaccessible
   - **Impact**: Cannot make bookings through API
   
3. **Session Management Missing**: Session scheduling not implemented
   - **Impact**: Cannot create movie sessions

### Working Alternatives
- ✅ **Theater Management**: Fully functional for admin operations
- ✅ **Movie Browsing**: Users can view movie catalog  
- ✅ **Basic Authentication**: Login/register works for basic testing

## Development Priorities

Based on integration test analysis:

### 🔥 **Urgent (Week 1)**
1. Fix user management route registration
2. Implement session management endpoints  
3. Restore reservation system functionality

### ⚡ **High Priority (Week 2-3)**
1. Stabilize authentication across all modules
2. Implement business logic for seat booking
3. Add proper validation and error handling

### 📅 **Medium Priority (Week 4+)**
1. Optimize working modules (theaters/movies)
2. Add comprehensive logging and monitoring
3. Implement advanced features (filters, search, etc.)

## Contributing

When contributing to this project:

1. **Run integration tests first**: `npm run test:integration`
2. **Check documentation**: Review `/documentação/documentação de bugs/`
3. **Focus on critical bugs**: Prioritize 404 errors and infrastructure issues
4. **Test your changes**: Ensure existing working functionality remains stable

## License

This project is licensed under the ISC License.

---

*Last updated based on comprehensive integration testing analysis - October 2024*
