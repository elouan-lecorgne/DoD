# Product Backlog - DoD Manager

## 🎯 Product Vision
Web application for managing Definition of Done (DoD) criteria across software development projects.

---

## 📋 User Stories

### US-001: User Registration
**As a** developer  
**I want to** create an account with username, email, and password  
**So that** I can access the DoD management system

**Priority:** High | **Story Points:** 5

**Acceptance Criteria:**
✅ **Positive:** User can register with valid email, username (3+ chars), and password (6+ chars)  
❌ **Negative:** System rejects registration with duplicate email and shows error message

---

### US-002: User Authentication
**As a** registered user  
**I want to** log in with my email and password  
**So that** I can access my projects and DoDs

**Priority:** High | **Story Points:** 3

**Acceptance Criteria:**
✅ **Positive:** User can log in with correct credentials and is redirected to dashboard  
❌ **Negative:** System rejects login with invalid credentials and displays error

---

### US-003: Project Creation
**As a** developer  
**I want to** create a new project with name and description  
**So that** I can organize my DoDs by project

**Priority:** High | **Story Points:** 8

**Acceptance Criteria:**
✅ **Positive:** User can create project with name (3+ chars) and becomes project owner  
❌ **Negative:** System prevents project creation with empty name and shows validation error

---

### US-004: Project Management
**As a** developer  
**I want to** view all projects I participate in  
**So that** I can navigate to the relevant DoDs

**Priority:** High | **Story Points:** 5

**Acceptance Criteria:**
✅ **Positive:** User sees list of all their projects with names, descriptions, and roles  
❌ **Negative:** User cannot see projects they don't have access to

---

### US-005: Add Project Participants
**As a** project owner  
**I want to** add participants by email with specific roles  
**So that** my team can collaborate on DoDs

**Priority:** Medium | **Story Points:** 8

**Acceptance Criteria:**
✅ **Positive:** Owner can add existing users by email with Editor or Viewer roles  
❌ **Negative:** System prevents adding non-existent email addresses with error message

---

### US-006: DoD Creation
**As a** project participant with edit permissions  
**I want to** create a Definition of Done for a project  
**So that** I can define completion criteria

**Priority:** High | **Story Points:** 8

**Acceptance Criteria:**
✅ **Positive:** Editor/Owner can create DoD with title and description  
❌ **Negative:** Viewer role cannot create DoDs and receives "No permission" error

---

### US-007: DoD Item Management
**As a** project editor  
**I want to** add specific items to a DoD with required/optional flags  
**So that** I can detail the exact completion criteria

**Priority:** High | **Story Points:** 5

**Acceptance Criteria:**
✅ **Positive:** Editor can add DoD items with title, description, and required flag  
❌ **Negative:** System prevents adding items with empty titles and shows validation error

---

### US-008: Multiple DoDs per Project
**As a** project owner  
**I want to** create multiple DoDs for different types of work  
**So that** I can have specific criteria for features, bugs, and releases

**Priority:** Medium | **Story Points:** 3

**Acceptance Criteria:**
✅ **Positive:** Project can have multiple active DoDs with different titles  
❌ **Negative:** System prevents duplicate DoD titles within the same project

---

## 🏃‍♂️ Sprint Planning

### Sprint 1 - Core Features (MVP)
- US-001: User Registration (5 pts)
- US-002: User Authentication (3 pts)
- US-003: Project Creation (8 pts)
- US-004: Project Management (5 pts)
- US-006: DoD Creation (8 pts)

**Total:** 29 pts

### Sprint 2 - Enhanced Features
- US-005: Add Project Participants (8 pts)
- US-007: DoD Item Management (5 pts)
- US-008: Multiple DoDs per Project (3 pts)

**Total:** 16 pts

---

## ✅ Definition of Done
A story is considered done when:
- [ ] Code implemented and tested
- [ ] Unit tests written and passing
- [ ] Feature works in both frontend and backend
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Acceptance criteria verified

---

## 📊 Progress Summary

| Feature Area | Stories | Points | Status |
|--------------|---------|---------|---------|
| Authentication | 2 | 8 | ✅ Complete |
| Project Management | 3 | 16 | ✅ Complete |
| DoD Management | 3 | 16 | ✅ Complete |
| **Total MVP** | **8** | **40** | **✅ 100%** |

---

## 🚀 Repository Access
**GitHub:** https://github.com/elouanlecorgne/DoD 
**Team:** Elouan Lecorgne  

---
