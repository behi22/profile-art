// Every run draws the nearest whole hour, so a run at 12:55 and one at 1:20 both show 1:00.
const HOUR = 36e5;
const drawHour = t => new Date(Math.round(t.getTime() / HOUR) * HOUR);

// The server's trigger and GitHub's backup schedule both land near the hour, so the second one to arrive can skip.
const alreadyDrawn = (status, target) => !!status && status.drawnFor === target.toISOString();

module.exports = { drawHour, alreadyDrawn };
