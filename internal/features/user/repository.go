package user

import (
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type IUserRepo interface {
	CreateUser(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByApiKey(apiKey string) (*models.User, error)
	FindByID(id string) (*models.User, error)
}

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

// CreateUser creates a new user in the database
func (r *UserRepo) CreateUser(user *models.User) error {
	return r.db.Create(&user).Error
}

// FindByEmail finds a user by email
func (r *UserRepo) FindByEmail(email string) (*models.User, error) {
	var user models.User
	return &user, r.db.Where("email = ?", email).First(&user).Error
}

// FindByApiKey finds a user by API key
func (r *UserRepo) FindByApiKey(apiKey string) (*models.User, error) {
	var user models.User
	return &user, r.db.Where("api_key = ?", apiKey).First(&user).Error
}

// FindByID finds a user by ID
func (r *UserRepo) FindByID(id string) (*models.User, error) {
	var user models.User
	return &user, r.db.Where("id = ?", id).First(&user).Error
}
