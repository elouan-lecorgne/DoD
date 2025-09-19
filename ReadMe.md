# DoD Manager - Definition of Done Management System

![DoD Manager](https://img.shields.io/badge/DoD-Manager-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8.svg)
![React](https://img.shields.io/badge/React-18+-61DAFB.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)

A comprehensive web application for managing Definition of Done (DoD) in software development projects, enabling teams to create, share, and track completion criteria across multiple projects.

**Live Application**: https://dod-manager.onrender.com

## Team Members

- **Elouan Lecorgne** 

## Features

### MVP (Minimum Viable Product) - Implemented
- User Authentication - Secure registration and login system with JWT
- Project Management - Create, update, and delete projects
- Multiple DoDs per Project - Support for various completion criteria
- Collaborative Projects - Multi-user project participation
- Participant Management - Add/remove project participants with editing rights
- DoD Item Management - Detailed completion criteria with requirements
- Responsive UI - Modern Material-UI interface

### Additional Features
- Role-based Access Control - Project owners can manage participants
- Project Dashboard - Overview of user's projects
- Real-time API integration - Frontend and backend communication
- Production deployment with SSL/HTTPS
- Automated CI/CD pipeline with testing

## Tech Stack

### Backend
- **Go 1.21** - Main backend language (new technology learned)
- **Gin Framework** - HTTP web framework
- **GORM** - ORM for database operations
- **PostgreSQL 13** - Primary database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **React 18** - Frontend framework
- **Material-UI (MUI)** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD pipeline
- **Render.com** - Cloud hosting platform
- **Let's Encrypt** - SSL certificates (via Render)

## Prerequisites

Before running this application, make sure you have the following installed:

- **Go 1.21 or higher** ([Download Go](https://golang.org/dl/))
- **Node.js 18+ and npm** ([Download Node.js](https://nodejs.org/))
- **Docker and Docker Compose** ([Download Docker](https://www.docker.com/get-started))
- **Git** ([Download Git](https://git-scm.com/downloads))

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dod-project.git
cd dod-project
```

### 2. Environment Configuration

Environment configuration files are included in the repository:
- `backend/.env` - Backend configuration (database, JWT, port)
- `frontend/.env` - Frontend configuration (API URL, application name)

**Review and modify values as needed** for your local environment:

#### Backend (`backend/.env`)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=dod_user
DB_PASSWORD=dod_password
DB_NAME=dod_database
JWT_SECRET=your-super-secret-jwt-key-here
PORT=8080
GIN_MODE=debug
```

#### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=/api/v1
REACT_APP_NAME=DoD Manager
```

### 3. Database Setup

Start PostgreSQL using Docker:
```bash
docker-compose up -d
```

Wait for PostgreSQL to be ready (about 15 seconds), then the database will be automatically migrated on first backend startup.

### 4. Quick Start with Development Script

```bash
# Run the automated development setup
./start-dev.sh
```

This script will:
- Start PostgreSQL in Docker
- Provide instructions for starting backend and frontend
- Display access URLs and test accounts

### 5. Manual Development Setup

#### Backend
```bash
cd backend
go mod tidy
go run main.go
```

The backend will be available at `http://localhost:8080`

#### Frontend
```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`

## Running Tests

### Backend Tests
```bash
cd backend
go test -v ./...

# Run specific test file
go test -v ./tests/
```

### Frontend Tests
```bash
cd frontend
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### CI/CD Pipeline Tests
The GitHub Actions pipeline automatically runs all tests on every push and pull request.

## API Documentation

### Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://dod-manager-backend.onrender.com`

### Authentication Endpoints
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Project Endpoints (Protected)
- `GET /api/v1/projects/` - Get user's projects
- `POST /api/v1/projects/` - Create new project
- `POST /api/v1/projects/:id/participants` - Add project participant

### DoD Endpoints (Protected)
- `GET /api/v1/projects/:id/dods` - Get project DoDs
- `POST /api/v1/dods/` - Create new DoD
- `POST /api/v1/dods/:id/items` - Add DoD item

### Health Check
- `GET /health` - Service health status

### Example API Usage

#### Registration
```bash
curl -X POST https://dod-manager-backend.onrender.com/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{"username":"newuser","email":"user@example.com","password":"password123"}'
```

#### Create Project
```bash
curl -X POST https://dod-manager-backend.onrender.com/api/v1/projects/ \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{"name":"My Project","description":"Project description"}'
```

## Project Architecture

```
dod-project/
├── backend/
│   ├── main.go              # Entry point
│   ├── config/              # Configuration management
│   ├── controllers/         # Request handlers
│   ├── database/            # DB connection & migrations
│   ├── middleware/          # Authentication & CORS
│   ├── models/              # Data models (User, Project, DoD)
│   ├── routes/              # Route definitions
│   ├── tests/               # Backend tests
│   ├── .env                 # Environment variables
│   └── Dockerfile           # Backend container
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components (Login, Dashboard)
│   │   ├── services/        # API services
│   │   └── tests/           # Frontend tests
│   ├── .env                 # Environment variables
│   └── nginx.conf           # Nginx configuration
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # CI/CD pipeline
├── docker-compose.yml       # Development environment
├── docker-compose.prod.yml  # Production environment
├── start-dev.sh            # Development startup script
├── Dockerfile              # Production multi-stage build
└── README.md               # This file
```

## Production Deployment

### Live URLs
- **Frontend**: https://dod-manager.onrender.com
- **Backend**: https://dod-manager-backend.onrender.com

### Deployment Architecture
```
Internet → Render.com Load Balancer → Frontend (React/Nginx) → Backend (Go) → PostgreSQL
```

### Environment Variables (Production)

#### Backend
```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=production-jwt-secret-key
GIN_MODE=release
PORT=10000
```

#### Frontend  
```env
REACT_APP_API_URL=https://dod-manager-backend.onrender.com/api/v1
REACT_APP_NAME=DoD Manager
NODE_ENV=production
```

### Automated Deployment Process

1. **Code Push**: Push to `main` branch
2. **CI Pipeline**: GitHub Actions runs tests
3. **Build**: Create Docker containers
4. **Deploy**: Render.com automatically deploys if tests pass
5. **Health Checks**: Verify services are running

### Manual Production Build

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build

# Or build individual services
docker build -f backend/Dockerfile -t dod-backend ./backend
docker build -f Dockerfile -t dod-frontend .
```

## CI/CD Pipeline

### GitHub Actions Workflow

The pipeline runs on every push to `test` branch:

1. **Test Stage**:
   - Set up Go 1.21 and Node.js 18
   - Start PostgreSQL service
   - Run backend tests (`go test -v ./...`)
   - Run frontend tests (`npm test -- --coverage --watchAll=false`)
   - Build both applications

2. **Deploy Stage** (main branch only):
   - Automatic deployment to Render.com
   - Health check verification

### Pipeline Configuration
- **Triggers**: Push to main/develop, Pull Requests to main
- **Test Database**: Temporary PostgreSQL instance
- **Test Coverage**: Frontend and backend code coverage
- **Build Verification**: Ensures both apps compile successfully

## Test Accounts

The application comes with seeded test data:

| Email | Password | Projects |
|-------|----------|----------|
| alice@example.com | password123 | Sample projects with DoDs |
| bob@example.com | password123 | Participant in shared projects |
| charlie@example.com | password123 | New user setup |

## Troubleshooting

### Common Development Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**Frontend API Connection Issues**
- Verify backend is running on correct port
- Check browser console for CORS errors
- Verify API URL in `.env` file

**Build Failures**
```bash
# Clean Go modules
cd backend && go mod tidy

# Clear npm cache and reinstall
cd frontend && rm -rf node_modules package-lock.json && npm install
```

**Production Deployment Issues**
- Check Render.com service logs
- Verify environment variables are set
- Confirm Docker builds succeed locally

### Performance Considerations

- Frontend assets are cached with 1-year expiry
- Database connections are pooled
- JWT tokens have reasonable expiration times
- Gzip compression enabled for static assets

## Security Features

- JWT-based authentication with secure token handling
- Password hashing using bcrypt
- HTTPS/SSL encryption in production
- SQL injection protection via GORM ORM
- Input validation on all endpoints
- CORS configuration for cross-origin requests
- Security headers (X-Frame-Options, X-Content-Type-Options)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

All contributions must pass the CI/CD pipeline tests before merging.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI team for the excellent React component library
- Gin framework contributors for the lightweight Go web framework
- GORM team for the powerful and intuitive ORM
- Render.com for providing free tier hosting
- GitHub for free CI/CD via GitHub Actions
- The open-source community for the amazing tools and libraries

## Project Status

**Current Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: September 2025

The application successfully meets all MVP requirements and is deployed with automated CI/CD pipeline, making it suitable for real-world usage in software development teams.
