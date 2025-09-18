package models

import (
	"time"
)

type User struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Projects     []Project           `json:"projects" gorm:"foreignkey:OwnerID"`
	Participants []ProjectParticipant `json:"participants" gorm:"foreignkey:UserID"`
}

type Project struct {
	ID          uint      `json:"id" gorm:"primary_key"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	OwnerID     uint      `json:"owner_id" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Owner        User                 `json:"owner" gorm:"foreignkey:OwnerID"`
	DoDs         []DoD               `json:"dods" gorm:"foreignkey:ProjectID"`
	Participants []ProjectParticipant `json:"participants" gorm:"foreignkey:ProjectID"`
}

type ProjectParticipant struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	ProjectID uint      `json:"project_id" gorm:"not null"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	Role      string    `json:"role" gorm:"default:'member'"` // owner, editor, viewer
	CreatedAt time.Time `json:"created_at"`

	// Relations
	Project Project `json:"project" gorm:"foreignkey:ProjectID"`
	User    User    `json:"user" gorm:"foreignkey:UserID"`
}

type DoD struct {
	ID          uint      `json:"id" gorm:"primary_key"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	ProjectID   uint      `json:"project_id" gorm:"not null"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Project Project   `json:"project" gorm:"foreignkey:ProjectID"`
	Creator User      `json:"creator" gorm:"foreignkey:CreatedBy"`
	Items   []DoDItem `json:"items" gorm:"foreignkey:DoDID"`
}

type DoDItem struct {
	ID          uint      `json:"id" gorm:"primary_key"`
	DoDID       uint      `json:"dod_id" gorm:"not null"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	IsRequired  bool      `json:"is_required" gorm:"default:true"`
	Order       int       `json:"order" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	DoD DoD `json:"dod" gorm:"foreignkey:DoDID"`
}

// DTOs pour les requêtes
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type CreateProjectRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type CreateDoDRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	ProjectID   uint   `json:"project_id" binding:"required"`
}

type CreateDoDItemRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	IsRequired  bool   `json:"is_required"`
	Order       int    `json:"order"`
}

type AddParticipantRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=editor viewer"`
}