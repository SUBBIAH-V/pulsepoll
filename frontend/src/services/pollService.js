import { fetchWithAuth } from './api';

export const pollService = {
  createPoll: async (question, options, expirationMinutes = 0) => {
    return await fetchWithAuth('/polls', {
      method: 'POST',
      body: JSON.stringify({
        question,
        options,
        expirationMinutes: parseInt(expirationMinutes, 10) || 0,
      }),
    });
  },

  createPollWithSlides: async (questions, expirationMinutes = 0) => {
    const firstSlide = questions[0] || {};
    const firstTitle = firstSlide.title || 'Poll Question';
    const firstOptions = (firstSlide.options && firstSlide.options.length >= 2)
      ? firstSlide.options
      : ['Option 1', 'Option 2'];

    return await fetchWithAuth('/polls', {
      method: 'POST',
      body: JSON.stringify({
        question: firstTitle,
        options: firstOptions,
        questions,
        expirationMinutes: parseInt(expirationMinutes, 10) || 0,
      }),
    });
  },

  getPollByID: async (id) => {
    return await fetchWithAuth(`/polls/${id}`, {
      method: 'GET',
    });
  },

  getPollResults: async (id) => {
    return await fetchWithAuth(`/polls/${id}/results`, {
      method: 'GET',
    });
  },

  getMyPolls: async () => {
    return await fetchWithAuth('/my-polls', {
      method: 'GET',
    });
  },

  submitVote: async (pollId, optionId, questionId, voterId) => {
    return await fetchWithAuth(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        optionId,
        questionId,
        voterId,
      }),
    });
  },

  vote: async (pollId, optionId, voterId) => {
    return await fetchWithAuth(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({
        optionId,
        voterId,
      }),
    });
  },

  setActiveSlide: async (pollId, slideIndex) => {
    return await fetchWithAuth(`/polls/${pollId}/slide`, {
      method: 'POST',
      body: JSON.stringify({ slideIndex }),
    });
  },

  submitOpenResponse: async (pollId, questionId, text, voterId) => {
    return await fetchWithAuth(`/polls/${pollId}/response`, {
      method: 'POST',
      body: JSON.stringify({ questionId, text, voterId }),
    });
  },

  submitQAQuestion: async (pollId, question, askedBy, voterId) => {
    return await fetchWithAuth(`/polls/${pollId}/qa`, {
      method: 'POST',
      body: JSON.stringify({ question, askedBy, voterId }),
    });
  },

  upvoteQAQuestion: async (pollId, qaId, voterId) => {
    return await fetchWithAuth(`/polls/${pollId}/qa/${qaId}/upvote`, {
      method: 'POST',
      body: JSON.stringify({ voterId }),
    });
  },

  closePoll: async (pollId) => {
    return await fetchWithAuth(`/polls/${pollId}/close`, {
      method: 'POST',
    });
  },
};
