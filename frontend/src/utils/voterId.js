// Generates or retrieves a persistent unique browser session ID for anti-duplicate voting
export const getVoterId = () => {
  let voterId = localStorage.getItem('pulsepoll_voter_id');
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('pulsepoll_voter_id', voterId);
  }
  return voterId;
};
