package controllers

import (
	"fmt"
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
	fmt.Printf("=== CREATE PROJECT DEBUG ===\n")
	fmt.Printf("UserID from context: %d\n", userID)

	// Vérifier que l'utilisateur existe
	var user models.User
	if err := ctrl.DB.First(&user, userID).Error; err != nil {
		fmt.Printf("User not found in DB: %v\n", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	fmt.Printf("User found: ID=%d, Username=%s, Email=%s\n", user.ID, user.Username, user.Email)

	project := models.Project{
		Name:        req.Name,
		Description: req.Description,
		OwnerID:     userID,
	}

	if err := ctrl.DB.Create(&project).Error; err != nil {
		fmt.Printf("Failed to create project: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}

	fmt.Printf("Project created: ID=%d, Name=%s, OwnerID=%d\n", project.ID, project.Name, project.OwnerID)

	participant := models.ProjectParticipant{
		ProjectID: project.ID,
		UserID:    userID,
		Role:      "owner",
	}
	
	if err := ctrl.DB.Create(&participant).Error; err != nil {
		fmt.Printf("Failed to create participant: %v\n", err)
	} else {
		fmt.Printf("Participant created: ProjectID=%d, UserID=%d, Role=%s\n", participant.ProjectID, participant.UserID, participant.Role)
	}

	// Recharger le projet avec Owner
	if err := ctrl.DB.Preload("Owner").First(&project, project.ID).Error; err != nil {
		fmt.Printf("Failed to reload project with Owner: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load project owner"})
		return
	}

	fmt.Printf("Project reloaded with Owner: %+v\n", project.Owner)
	fmt.Printf("Owner details: ID=%d, Username=%s, Email=%s\n", project.Owner.ID, project.Owner.Username, project.Owner.Email)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project,
	})
}
func (ctrl *Controller) GetUserProjects(c *gin.Context) {
	userID := c.GetUint("user_id")
	fmt.Printf("=== GET USER PROJECTS DEBUG ===\n")
	fmt.Printf("UserID: %d\n", userID)

	var projects []models.Project
	err := ctrl.DB.Joins("JOIN project_participants ON projects.id = project_participants.project_id").
		Where("project_participants.user_id = ?", userID).
		Preload("Owner").
		Find(&projects).Error

	if err != nil {
		fmt.Printf("Error fetching projects: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	fmt.Printf("Found %d projects\n", len(projects))
	for i, project := range projects {
		fmt.Printf("Project %d: ID=%d, Name=%s, OwnerID=%d\n", i, project.ID, project.Name, project.OwnerID)
		if project.Owner.ID != 0 {
			fmt.Printf("  Owner: ID=%d, Username=%s, Email=%s\n", project.Owner.ID, project.Owner.Username, project.Owner.Email)
		} else {
			fmt.Printf("  Owner: EMPTY/NULL\n")
		}
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

	currentUserID := c.GetUint("user_id")
	var userParticipant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		projectID, currentUserID, []string{"owner", "editor"}).First(&userParticipant).Error
	
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to add participants"})
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

func (ctrl *Controller) DeleteProject(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID := c.GetUint("user_id")

	var project models.Project
	if err := ctrl.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	if project.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only project owner can delete the project"})
		return
	}

	ctrl.DB.Where("dod_id IN (SELECT id FROM do_ds WHERE project_id = ?)", projectID).Delete(&models.DoDItem{})
	
	ctrl.DB.Where("project_id = ?", projectID).Delete(&models.DoD{})
	
	ctrl.DB.Where("project_id = ?", projectID).Delete(&models.ProjectParticipant{})
	
	if err := ctrl.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}


func (ctrl *Controller) GetProject(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID := c.GetUint("user_id")

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&participant).Error
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No access to this project"})
		return
	}

	var project models.Project
	if err := ctrl.DB.Preload("Owner").First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"project": project})
}

func (ctrl *Controller) GetParticipants(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	userID := c.GetUint("user_id")

	var userParticipant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&userParticipant).Error
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No access to this project"})
		return
	}

	var participants []models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ?", projectID).
		Preload("User").
		Find(&participants).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch participants"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"participants": participants})
}

func (ctrl *Controller) RemoveParticipant(c *gin.Context) {
	projectID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	participantID, err := strconv.Atoi(c.Param("participantId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid participant ID"})
		return
	}

	userID := c.GetUint("user_id")

	var userParticipant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		projectID, userID, []string{"owner", "editor"}).First(&userParticipant).Error
	
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to remove participants"})
		return
	}

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("id = ? AND project_id = ?", participantID, projectID).First(&participant).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Participant not found"})
		return
	}

	if participant.Role == "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot remove project owner"})
		return
	}

	if participant.UserID == userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot remove yourself"})
		return
	}

	if err := ctrl.DB.Delete(&participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove participant"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Participant removed successfully",
	})
}

func (ctrl *Controller) UpdateDoD(c *gin.Context) {
	dodID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid DoD ID"})
		return
	}

	var req models.UpdateDoDRequest 
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	var dod models.DoD
	err = ctrl.DB.First(&dod, dodID).Error
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

	dod.Title = req.Title
	dod.Description = req.Description

	if err := ctrl.DB.Save(&dod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update DoD"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "DoD updated successfully",
		"dod":     dod,
	})
}

func (ctrl *Controller) DeleteDoD(c *gin.Context) {
	dodID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid DoD ID"})
		return
	}

	userID := c.GetUint("user_id")

	var dod models.DoD
	err = ctrl.DB.First(&dod, dodID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD not found"})
		return
	}

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		dod.ProjectID, userID, []string{"owner", "editor"}).First(&participant).Error
	
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to delete this DoD"})
		return
	}

	ctrl.DB.Where("dod_id = ?", dodID).Delete(&models.DoDItem{})
	
	if err := ctrl.DB.Delete(&dod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete DoD"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "DoD deleted successfully",
	})
}

func (ctrl *Controller) UpdateDoDItem(c *gin.Context) {
	dodID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid DoD ID"})
		return
	}

	itemID, err := strconv.Atoi(c.Param("itemId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	var req models.UpdateDoDItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("=== UPDATE ITEM DEBUG ===\n")
	fmt.Printf("DoD ID: %d, Item ID: %d\n", dodID, itemID)

	userID := c.GetUint("user_id")

	var item models.DoDItem
	err = ctrl.DB.Where("id = ?", itemID).First(&item).Error
	if err != nil {
		fmt.Printf("Item with ID %d not found: %v\n", itemID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD item not found"})
		return
	}

	fmt.Printf("Item found: ID=%d, DoDID=%d, Title=%s\n", item.ID, item.DoDID, item.Title)

	if item.DoDID != uint(dodID) {
		fmt.Printf("Item belongs to DoD %d, but request is for DoD %d\n", item.DoDID, dodID)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD item not found in specified DoD"})
		return
	}

	var dod models.DoD
	err = ctrl.DB.First(&dod, dodID).Error
	if err != nil {
		fmt.Printf("DoD %d not found: %v\n", dodID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD not found"})
		return
	}

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		dod.ProjectID, userID, []string{"owner", "editor"}).First(&participant).Error
	
	if err != nil {
		fmt.Printf("Permission denied: %v\n", err)
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to edit this DoD item"})
		return
	}

	fmt.Printf("Updating item: %s -> %s\n", item.Title, req.Title)
	item.Title = req.Title
	item.Description = req.Description
	item.IsRequired = req.IsRequired
	item.Order = req.Order

	if err := ctrl.DB.Save(&item).Error; err != nil {
		fmt.Printf("Failed to save item: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update DoD item"})
		return
	}

	fmt.Printf("Item updated successfully\n")
	c.JSON(http.StatusOK, gin.H{
		"message": "DoD item updated successfully",
		"item":    item,
	})
}

func (ctrl *Controller) DeleteDoDItem(c *gin.Context) {
	dodID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid DoD ID"})
		return
	}

	itemID, err := strconv.Atoi(c.Param("itemId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}

	fmt.Printf("=== DELETE ITEM DEBUG ===\n")
	fmt.Printf("DoD ID: %d, Item ID: %d\n", dodID, itemID)

	userID := c.GetUint("user_id")

	var item models.DoDItem
	err = ctrl.DB.Where("id = ?", itemID).First(&item).Error
	if err != nil {
		fmt.Printf("Item with ID %d not found: %v\n", itemID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD item not found"})
		return
	}

	fmt.Printf("Item found: ID=%d, DoDID=%d, Title=%s\n", item.ID, item.DoDID, item.Title)

	if item.DoDID != uint(dodID) {
		fmt.Printf("Item belongs to DoD %d, but request is for DoD %d\n", item.DoDID, dodID)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD item not found in specified DoD"})
		return
	}

	var dod models.DoD
	err = ctrl.DB.First(&dod, dodID).Error
	if err != nil {
		fmt.Printf("DoD %d not found: %v\n", dodID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "DoD not found"})
		return
	}

	var participant models.ProjectParticipant
	err = ctrl.DB.Where("project_id = ? AND user_id = ? AND role IN (?)", 
		dod.ProjectID, userID, []string{"owner", "editor"}).First(&participant).Error
	
	if err != nil {
		fmt.Printf("Permission denied: %v\n", err)
		c.JSON(http.StatusForbidden, gin.H{"error": "No permission to delete this DoD item"})
		return
	}

	fmt.Printf("Deleting item with ID: %d\n", item.ID)
	if err := ctrl.DB.Delete(&models.DoDItem{}, item.ID).Error; err != nil {
		fmt.Printf("Failed to delete item: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete DoD item"})
		return
	}

	fmt.Printf("Item deleted successfully\n")
	c.JSON(http.StatusOK, gin.H{
		"message": "DoD item deleted successfully",
	})
}