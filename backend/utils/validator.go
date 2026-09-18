package utils

import (
	"errors"
	"strings"

	"live-polling-app/backend/models"
)

func ValidatePollRequest(req *models.CreatePollRequest) error {
	// 1. If multi-question slides are provided
	if len(req.Questions) > 0 {
		if len(req.Questions) > 20 {
			return errors.New("a poll presentation cannot exceed 20 questions")
		}

		for qIdx, q := range req.Questions {
			trimmedTitle := strings.TrimSpace(q.Title)
			if trimmedTitle == "" {
				return errors.New("question title is required for all slides")
			}
			if len(trimmedTitle) < 3 {
				return errors.New("question title must be at least 3 characters long")
			}
			req.Questions[qIdx].Title = trimmedTitle

			qType := q.Type
			if qType == "" {
				qType = string(models.TypeMultipleChoice)
			}
			req.Questions[qIdx].Type = qType

			if qType == string(models.TypeMultipleChoice) {
				if len(q.Options) < 2 {
					return errors.New("multiple choice questions must have at least 2 options")
				}
				if len(q.Options) > 10 {
					return errors.New("multiple choice questions cannot have more than 10 options")
				}

				seenOptions := make(map[string]bool)
				for i, opt := range q.Options {
					trimmedOpt := strings.TrimSpace(opt)
					if trimmedOpt == "" {
						return errors.New("poll options cannot be empty")
					}
					lowerOpt := strings.ToLower(trimmedOpt)
					if seenOptions[lowerOpt] {
						return errors.New("duplicate options are not allowed within a question")
					}
					seenOptions[lowerOpt] = true
					q.Options[i] = trimmedOpt
				}
			}
		}

		return nil
	}

	// 2. Single Question Fallback Validation
	trimmedQuestion := strings.TrimSpace(req.Question)
	if trimmedQuestion == "" {
		return errors.New("poll question is required")
	}
	if len(trimmedQuestion) < 5 {
		return errors.New("poll question must be at least 5 characters long")
	}
	if len(trimmedQuestion) > 300 {
		return errors.New("poll question cannot exceed 300 characters")
	}

	if len(req.Options) < 2 {
		return errors.New("a poll must have at least 2 options")
	}
	if len(req.Options) > 10 {
		return errors.New("a poll cannot have more than 10 options")
	}

	seenOptions := make(map[string]bool)
	for i, opt := range req.Options {
		trimmedOpt := strings.TrimSpace(opt)
		if trimmedOpt == "" {
			return errors.New("poll options cannot be empty")
		}
		if len(trimmedOpt) > 100 {
			return errors.New("poll option text cannot exceed 100 characters")
		}

		lowerOpt := strings.ToLower(trimmedOpt)
		if seenOptions[lowerOpt] {
			return errors.New("duplicate options are not allowed")
		}
		seenOptions[lowerOpt] = true
		req.Options[i] = trimmedOpt
	}

	return nil
}

