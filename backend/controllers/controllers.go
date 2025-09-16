package controllers

import (
	"net/http"
	"strconv"

	"dod-backend/config"
	"dod-backend/middleware"
	"dod-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

type Controller struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewController(db *gorm.DB, cfg *config.Config) *Controller {
	return &Controller{DB: db, Cfg: cfg}
}

// Auth Controllers
func (ctrl *Controller) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
	}

	if err := ctrl.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	token, err := middleware.GenerateJWT(&user, ctrl.Cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"token":   token,
		"user":    user,
	})
}

func (ctrl *Controller) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := ctrl.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := middleware.GenerateJWT(&user, ctrl.Cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user":    user,
	})
}

// Project Controllers
func (ctrl *Controller) CreateProject(c *gin.Context) {
	var req models.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	project := models.Project{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	if err := ctrl.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	participant := models.ProjectParticipant{
		ProjectID: project.ID,
		UserID:    userID,
		Role:      "owner",
	}
	ctrl.DB.Create(&participant)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project,
	})
}

func (ctrl *Controller) GetUserProjects(c *gin.Context) {
	userID := c.GetUint("user_id")

	var projects []models.Project
	err := ctrl.DB.Joins("JOIN project_participants ON projects.id = project_participants.project_id").
		Where("project_participants.user_id = ?", userID).
		Preload("Owner").
		Find(&projects).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

func (ctrl *Controller) AddProjectParticipant(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req models.AddParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user is project owner
	currentUserID := c.GetUint("user_id")
	var project models.Project
	if err := ctrl.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != currentUserID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only project owner can add participants"})
		return
	}

	// Find user by email
	var user models.User
	if err := ctrl.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Add participant
	participant := models.ProjectParticipant{
		ProjectID: uint(projectID),
		UserID:    user.ID,
		Role:      req.Role,
	}

	if err := ctrl.DB.Create(&participant).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already participant"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Participant added successfully",
		"participant": participant,
	})
}

// DoD Controllers
func (ctrl *Controller) CreateDoD(c *gin.Context) {
	var req models.CreateDoDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")
	
	// Check if user can edit this project
	var participant models.ProjectParticipant
	err := ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		req.ProjectID, userID, []string{"owner", "editor"}).First(&participant).Error
	
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to create DoD for this project"})
		return
	}

	dod := models.DoD{
		Title:       req.Title,
		Description: req.Description,
		ProjectID:   req.ProjectID,
		CreatedBy:   userID,
		IsActive:    true,
	}

	if err := ctrl.DB.Create(&dod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create DoD"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "DoD created successfully",
		"dod":     dod,
	})
}

func (ctrl *Controller) GetProjectDoDs(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID := c.GetUint("user_id")
	
	// Check if user can view this project
	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&participant).Error
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No access to this project"})
		return
	}

	var dods []models.DoD
	err = ctrl.DB.Where("project_id = ?", projectID).
		Preload("Items").
		Preload("Creator").
		Find(&dods).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch DoDs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"dods": dods})
}

func (ctrl *Controller) AddDoDItem(c *gin.Context) {
	dodID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid DoD ID"})
		return
	}

	var req models.CreateDoDItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	// Check permissions
	var dod models.DoD
	err = ctrl.DB.Preload("Project").First(&dod, dodID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD not found"})
		return
	}

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		dod.ProjectID, userID, []string{"owner", "editor"}).First(&participant).Error
	
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to edit this DoD"})
		return
	}

	item := models.DoDItem{
		DoDID:       uint(dodID),
		Title:       req.Title,
		Description: req.Description,
		IsRequired:  req.IsRequired,
		Order:       req.Order,
	}

	if err := ctrl.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create DoD item"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "DoD item added successfully",
		"item":    item,
	})
}