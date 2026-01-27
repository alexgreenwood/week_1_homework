// MLB Stats API Base URL
const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

// Team abbreviations
const TEAM_ABBREV = {
    'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL',
    'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CHW',
    'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL',
    'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
    'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA',
    'Milwaukee Brewers': 'MIL', 'Minnesota Twins': 'MIN', 'New York Mets': 'NYM',
    'New York Yankees': 'NYY', 'Oakland Athletics': 'OAK', 'Philadelphia Phillies': 'PHI',
    'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
    'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL', 'Tampa Bay Rays': 'TB',
    'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR', 'Washington Nationals': 'WSH',
    'Athletics': 'OAK', 'Cleveland Indians': 'CLE'
};

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
            `${MLB_API_BASE}/schedule?sportId=1&date=${selectedDate}&hydrate=team,linescore(runners,defense,offense),venue`
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
            <div class="no-games">
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

// Get team abbreviation
function getAbbrev(teamName) {
    return TEAM_ABBREV[teamName] || teamName.substring(0, 3).toUpperCase();
}

// Create HTML for a single game card with box score
function createGameCard(game) {
    const status = getGameStatus(game);
    const awayTeam = game.teams.away;
    const homeTeam = game.teams.home;
    const venue = game.venue?.name || 'TBD';
    const location = game.venue?.location
        ? `${game.venue.location.city}, ${game.venue.location.state || game.venue.location.country}`
        : '';

    const linescore = game.linescore;
    const innings = linescore?.innings || [];
    const currentInning = linescore?.currentInning;
    const inningState = linescore?.inningState;

    const awayRuns = linescore?.teams?.away?.runs ?? '-';
    const homeRuns = linescore?.teams?.home?.runs ?? '-';
    const awayHits = linescore?.teams?.away?.hits ?? '-';
    const homeHits = linescore?.teams?.home?.hits ?? '-';
    const awayErrors = linescore?.teams?.away?.errors ?? '-';
    const homeErrors = linescore?.teams?.home?.errors ?? '-';

    const gameTime = formatGameTime(game.gameDate);
    const gameDate = formatGameDate(game.gameDate);

    // Determine winner for final games
    const awayWinner = status.type === 'final' && awayRuns > homeRuns;
    const homeWinner = status.type === 'final' && homeRuns > awayRuns;

    const awayAbbrev = getAbbrev(awayTeam.team.name);
    const homeAbbrev = getAbbrev(homeTeam.team.name);

    // For scheduled games, show simpler preview
    if (status.type === 'scheduled') {
        return `
            <div class="game-card">
                <div class="game-header">
                    <span class="matchup">${awayAbbrev} at ${homeAbbrev}</span>
                    <span class="status">${status.text}</span>
                </div>
                <div class="scheduled-game">
                    <div class="teams-preview">
                        ${awayTeam.team.name}
                        <span class="at-symbol">@</span>
                        ${homeTeam.team.name}
                    </div>
                    <div class="game-time">${gameTime}</div>
                    <div class="venue">${venue}${location ? `, ${location}` : ''}</div>
                </div>
            </div>
        `;
    }

    // Build inning headers (1-9 minimum, more if extra innings)
    const numInnings = Math.max(9, innings.length);
    let inningHeaders = '';
    let awayInnings = '';
    let homeInnings = '';

    for (let i = 1; i <= numInnings; i++) {
        const inning = innings[i - 1];
        const isExtra = i > 9;
        inningHeaders += `<th class="inning-col ${isExtra ? 'extra' : ''}">${i}</th>`;

        if (inning) {
            awayInnings += `<td class="inning-col ${isExtra ? 'extra' : ''}">${inning.away?.runs ?? ''}</td>`;
            // Home team might not have batted in current inning
            const homeRun = inning.home?.runs;
            homeInnings += `<td class="inning-col ${isExtra ? 'extra' : ''}">${homeRun !== undefined ? homeRun : ''}</td>`;
        } else {
            awayInnings += `<td class="inning-col ${isExtra ? 'extra' : ''}"></td>`;
            homeInnings += `<td class="inning-col ${isExtra ? 'extra' : ''}"></td>`;
        }
    }

    // Status text with inning info for live games
    let statusText = status.text;
    if (status.type === 'live' && currentInning) {
        statusText = `${inningState} ${currentInning}`;
    }

    return `
        <div class="game-card">
            <div class="game-header">
                <span class="matchup">${awayAbbrev} at ${homeAbbrev}</span>
                <span class="status ${status.type}">${statusText}</span>
            </div>
            <table class="box-score">
                <thead>
                    <tr>
                        <th class="team-col">Team</th>
                        ${inningHeaders}
                        <th class="total-col">R</th>
                        <th class="rhe-col">H</th>
                        <th class="rhe-col">E</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="${awayWinner ? 'winner' : ''}">
                        <td class="team-col">
                            <span class="abbrev">${awayAbbrev}</span>
                            <span class="record">(${awayTeam.leagueRecord?.wins || 0}-${awayTeam.leagueRecord?.losses || 0})</span>
                        </td>
                        ${awayInnings}
                        <td class="total-col">${awayRuns}</td>
                        <td class="rhe-col">${awayHits}</td>
                        <td class="rhe-col">${awayErrors}</td>
                    </tr>
                    <tr class="${homeWinner ? 'winner' : ''}">
                        <td class="team-col">
                            <span class="abbrev">${homeAbbrev}</span>
                            <span class="record">(${homeTeam.leagueRecord?.wins || 0}-${homeTeam.leagueRecord?.losses || 0})</span>
                        </td>
                        ${homeInnings}
                        <td class="total-col">${homeRuns}</td>
                        <td class="rhe-col">${homeHits}</td>
                        <td class="rhe-col">${homeErrors}</td>
                    </tr>
                </tbody>
            </table>
            <div class="game-info">
                <span><strong>Venue:</strong> ${venue}</span>
                ${location ? `<span><strong>Location:</strong> ${location}</span>` : ''}
                <span><strong>First Pitch:</strong> ${gameTime}</span>
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
            return { type: 'live', text: 'IN PROGRESS' };
        case 'Final':
            return { type: 'final', text: detailedState || 'FINAL' };
        case 'Preview':
        default:
            return { type: 'scheduled', text: detailedState || 'SCHEDULED' };
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

// Format game date
function formatGameDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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
    lastUpdated.textContent = `Edition: ${now.toLocaleTimeString()}`;
}

// Start the app
init();
