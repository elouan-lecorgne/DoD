package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"dod-backend/config"
	"dod-backend/controllers"
	"dod-backend/database"
	"dod-backend/middleware"
	"dod-backend/models"
	"dod-backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthCheck(t *testing.T) {
    router := setupTestRouter()
    
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/health", nil)
    router.ServeHTTP(w, req)
    
    assert.Equal(t, http.StatusOK, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, "ok", response["status"])
}


func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	
	// Use test config
	cfg := &config.Config{
		DBHost:      "localhost",
		DBPort:      "5432",
		DBUser:      "test_user",
		DBPassword:  "test_password",
		DBName:      "test_database",
		JWTSecret:   "test-secret-key",
		Environment: "test",
	}

	// Initialize test database (you might want to use sqlite in memory for tests)
	db := database.Initialize(cfg)
	
	r := gin.Default()
	routes.SetupRoutes(r, db)
	
	return r
}

func TestCreateProject(t *testing.T) {
	router := setupTestRouter()

	// First, create and login a user to get token
	registerReq := models.RegisterRequest{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	regBody, _ := json.Marshal(registerReq)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var regResponse map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &regResponse)
	token := regResponse["token"].(string)

	// Now test creating a project
	projectReq := models.CreateProjectRequest{
		Name:        "Test Project",
		Description: "A test project",
	}

	body, _ := json.Marshal(projectReq)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/v1/projects/", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Project created successfully", response["message"])
	assert.NotNil(t, response["project"])
}

func TestGetUserProjects(t *testing.T) {
	router := setupTestRouter()

	// Register and login user
	registerReq := models.RegisterRequest{
		Username: "testuser2",
		Email:    "test2@example.com",
		Password: "password123",
	}

	regBody, _ := json.Marshal(registerReq)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(regBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	var regResponse map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &regResponse)
	token := regResponse["token"].(string)

	// Get user projects
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/api/v1/projects/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotNil(t, response["projects"])
}

func TestUnauthorizedAccess(t *testing.T) {
	router := setupTestRouter()

	// Try to access protected route without token
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/projects/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "Authorization header required", response["error"])
}