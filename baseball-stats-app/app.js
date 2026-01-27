// MLB Stats API Base URL
const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// DOM Elements
const datePicker = document.getElementById('date-picker');
const refreshBtn = document.getElementById('refresh-btn');
const lastUpdated = document.getElementById('last-updated');
const loading = document.getElementById('loading');
const noGames = document.getElementById('no-games');
const gamesContainer = document.getElementById('games-container');

// Initialize the app
function init() {
    // Set date picker to today
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;

    // Event listeners
    datePicker.addEventListener('change', fetchGames);
    refreshBtn.addEventListener('click', fetchGames);

    // Initial fetch
    fetchGames();

    // Auto-refresh every 30 seconds for live games
    setInterval(fetchGames, 30000);
}

// Fetch games from MLB API
async function fetchGames() {
    const selectedDate = datePicker.value;

    showLoading(true);

    try {
        const response = await fetch(
            `${MLB_API_BASE}/schedule?sportId=1&date=${selectedDate}&hydrate=team,linescore,venue`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }

        const data = await response.json();
        const games = data.dates?.[0]?.games || [];

        displayGames(games);
        updateLastUpdated();

    } catch (error) {
        console.error('Error fetching games:', error);
        gamesContainer.innerHTML = `
            <div class="no-games" style="grid-column: 1 / -1;">
                <p>Error loading games. Please try again.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// Display games in the UI
function displayGames(games) {
    if (games.length === 0) {
        noGames.style.display = 'block';
        gamesContainer.innerHTML = '';
        return;
    }

    noGames.style.display = 'none';
    gamesContainer.innerHTML = games.map(game => createGameCard(game)).join('');
}

// Create HTML for a single game card
function createGameCard(game) {
    const status = getGameStatus(game);
    const awayTeam = game.teams.away;
    const homeTeam = game.teams.home;
    const venue = game.venue?.name || 'TBD';
    const location = game.venue?.location
        ? `${game.venue.location.city}, ${game.venue.location.state || game.venue.location.country}`
        : '';

    const linescore = game.linescore;
    const inning = linescore?.currentInning;
    const inningState = linescore?.inningState;

    const awayScore = linescore?.teams?.away?.runs ?? '-';
    const homeScore = linescore?.teams?.home?.runs ?? '-';

    const gameTime = formatGameTime(game.gameDate);

    // Determine winner for final games
    const awayWinner = status.type === 'final' && awayScore > homeScore;
    const homeWinner = status.type === 'final' && homeScore > awayScore;

    return `
        <div class="game-card">
            <div class="game-status ${status.type}">${status.text}</div>
            <div class="game-content">
                <div class="teams">
                    <div class="team ${awayWinner ? 'winner' : ''}">
                        <div class="team-info">
                            <img class="team-logo"
                                 src="https://www.mlbstatic.com/team-logos/${awayTeam.team.id}.svg"
                                 alt="${awayTeam.team.name}"
                                 onerror="this.style.display='none'">
                            <div>
                                <div class="team-name">${awayTeam.team.name}</div>
                                <div class="team-record">${awayTeam.leagueRecord?.wins || 0}-${awayTeam.leagueRecord?.losses || 0}</div>
                            </div>
                        </div>
                        <div class="team-score">${awayScore}</div>
                    </div>
                    <div class="team ${homeWinner ? 'winner' : ''}">
                        <div class="team-info">
                            <img class="team-logo"
                                 src="https://www.mlbstatic.com/team-logos/${homeTeam.team.id}.svg"
                                 alt="${homeTeam.team.name}"
                                 onerror="this.style.display='none'">
                            <div>
                                <div class="team-name">${homeTeam.team.name}</div>
                                <div class="team-record">${homeTeam.leagueRecord?.wins || 0}-${homeTeam.leagueRecord?.losses || 0}</div>
                            </div>
                        </div>
                        <div class="team-score">${homeScore}</div>
                    </div>
                </div>
                <div class="game-details">
                    ${inning ? `
                        <p>
                            <span class="icon">&#9918;</span>
                            <strong>Inning:</strong>
                            <span class="inning-indicator">${inningState} ${inning}</span>
                        </p>
                    ` : ''}
                    <p>
                        <span class="icon">&#128205;</span>
                        <strong>Venue:</strong> ${venue}
                    </p>
                    ${location ? `
                        <p>
                            <span class="icon">&#127968;</span>
                            <strong>Location:</strong> ${location}
                        </p>
                    ` : ''}
                    <p>
                        <span class="icon">&#128336;</span>
                        <strong>Time:</strong> ${gameTime}
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Get game status (scheduled, live, final)
function getGameStatus(game) {
    const state = game.status?.abstractGameState;
    const detailedState = game.status?.detailedState;

    switch (state) {
        case 'Live':
            return { type: 'live', text: 'LIVE' };
        case 'Final':
            return { type: 'final', text: detailedState || 'Final' };
        case 'Preview':
        default:
            return { type: 'scheduled', text: detailedState || 'Scheduled' };
    }
}

// Format game time
function formatGameTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Show/hide loading spinner
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    if (show) {
        gamesContainer.innerHTML = '';
        noGames.style.display = 'none';
    }
}

// Update last updated timestamp
function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

// Start the app
init();
