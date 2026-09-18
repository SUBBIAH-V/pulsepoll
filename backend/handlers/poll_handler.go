package handlers

import (
	"net/http"

	"live-polling-app/backend/models"
	"live-polling-app/backend/services"

	"github.com/gin-gonic/gin"
)

type PollHandler struct {
	pollService *services.PollService
	voteService *services.VoteService
}

func NewPollHandler(pollService *services.PollService, voteService *services.VoteService) *PollHandler {
	return &PollHandler{
		pollService: pollService,
		voteService: voteService,
	}
}

func (h *PollHandler) CreatePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse("Authentication required"))
		return
	}

	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Invalid request body: "+err.Error()))
		return
	}

	poll, err := h.pollService.CreatePoll(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponse(poll, "Poll created successfully"))
}

func (h *PollHandler) GetPollByID(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Poll ID is required"))
		return
	}

	results, err := h.pollService.GetPollByID(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(results, "Poll fetched successfully"))
}

func (h *PollHandler) GetPollResults(c *gin.Context) {
	pollID := c.Param("id")
	results, err := h.pollService.GetPollByID(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse(err.Error()))
		return
	}
	c.JSON(http.StatusOK, models.SuccessResponse(results, "Poll results retrieved"))
}

func (h *PollHandler) GetMyPolls(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse("Authentication required"))
		return
	}

	polls, err := h.pollService.GetMyPolls(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse("Failed to fetch user polls"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(polls, "My polls retrieved"))
}

func (h *PollHandler) Vote(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Poll ID is required"))
		return
	}

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Option selection is required"))
		return
	}

	clientIP := c.ClientIP()
	updatedResults, err := h.voteService.SubmitVote(c.Request.Context(), pollID, &req, clientIP)
	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "poll not found" {
			status = http.StatusNotFound
		} else if err.Error() == "you have already voted in this poll" {
			status = http.StatusConflict
		}
		c.JSON(status, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(updatedResults, "Vote recorded successfully"))
}

func (h *PollHandler) ClosePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse("Authentication required"))
		return
	}

	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Poll ID is required"))
		return
	}

	res, err := h.pollService.ClosePoll(c.Request.Context(), pollID, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(res, "Poll stopped/closed successfully"))
}

func (h *PollHandler) SetActiveSlide(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse("Authentication required"))
		return
	}

	pollID := c.Param("id")
	var req models.SetActiveSlideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Invalid slide index"))
		return
	}

	res, err := h.pollService.SetActiveSlide(c.Request.Context(), pollID, req.SlideIndex, userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(res, "Active slide updated"))
}

func (h *PollHandler) SubmitOpenResponse(c *gin.Context) {
	pollID := c.Param("id")
	var req models.SubmitOpenResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Response text is required"))
		return
	}

	res, err := h.pollService.SubmitOpenResponse(c.Request.Context(), pollID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(res, "Response submitted"))
}

func (h *PollHandler) SubmitQAQuestion(c *gin.Context) {
	pollID := c.Param("id")
	var req models.SubmitQARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Question text is required"))
		return
	}

	res, err := h.pollService.SubmitQAQuestion(c.Request.Context(), pollID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(res, "Question submitted to Q&A"))
}

func (h *PollHandler) UpvoteQAQuestion(c *gin.Context) {
	pollID := c.Param("id")
	qaID := c.Param("qaId")
	var req models.UpvoteQARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse("Voter ID is required"))
		return
	}

	res, err := h.pollService.UpvoteQAQuestion(c.Request.Context(), pollID, qaID, req.VoterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse(res, "Question upvoted"))
}

