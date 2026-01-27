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

// Cache for boxscore data
const boxscoreCache = {};

// DOM Elements
const datePicker = document.getElementById('date-picker');
const refreshBtn = document.getElementById('refresh-btn');
const lastUpdated = document.getElementById('last-updated');
const loading = document.getElementById('loading');
const noGames = document.getElementById('no-games');
const gamesContainer = document.getElementById('games-container');

// Initialize the app
function init() {
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;

    datePicker.addEventListener('change', fetchGames);
    refreshBtn.addEventListener('click', fetchGames);

    fetchGames();
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

        if (!response.ok) throw new Error('Failed to fetch games');

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

// Fetch detailed boxscore for a game
async function fetchBoxscore(gamePk) {
    if (boxscoreCache[gamePk]) {
        return boxscoreCache[gamePk];
    }

    try {
        const response = await fetch(
            `${MLB_API_BASE}.1/game/${gamePk}/boxscore`
        );
        if (!response.ok) throw new Error('Failed to fetch boxscore');

        const data = await response.json();
        boxscoreCache[gamePk] = data;
        return data;
    } catch (error) {
        console.error('Error fetching boxscore:', error);
        return null;
    }
}

// Toggle player stats visibility
async function togglePlayerStats(gamePk, awayName, homeName) {
    const statsContainer = document.getElementById(`stats-${gamePk}`);
    const toggleBtn = document.getElementById(`toggle-${gamePk}`);

    if (statsContainer.classList.contains('expanded')) {
        statsContainer.classList.remove('expanded');
        toggleBtn.textContent = 'Show Player Stats';
        return;
    }

    toggleBtn.textContent = 'Loading...';
    toggleBtn.disabled = true;

    const boxscore = await fetchBoxscore(gamePk);

    if (boxscore) {
        statsContainer.innerHTML = createPlayerStatsHTML(boxscore, awayName, homeName);
        statsContainer.classList.add('expanded');
        toggleBtn.textContent = 'Hide Player Stats';
    } else {
        toggleBtn.textContent = 'Error - Try Again';
    }

    toggleBtn.disabled = false;
}

// Create player stats HTML
function createPlayerStatsHTML(boxscore, awayName, homeName) {
    const awayBatters = boxscore.teams.away.batters || [];
    const homeBatters = boxscore.teams.home.batters || [];
    const awayPitchers = boxscore.teams.away.pitchers || [];
    const homePitchers = boxscore.teams.home.pitchers || [];
    const players = boxscore.teams.away.players;
    const homePlayers = boxscore.teams.home.players;

    const awayAbbrev = getAbbrev(awayName);
    const homeAbbrev = getAbbrev(homeName);

    // Get batting stats
    const awayBattingStats = awayBatters.map(id => {
        const player = players[`ID${id}`];
        if (!player || !player.stats.batting) return null;
        const stats = player.stats.batting;
        return {
            name: formatPlayerName(player.person.fullName),
            position: player.position.abbreviation,
            ab: stats.atBats ?? 0,
            r: stats.runs ?? 0,
            h: stats.hits ?? 0,
            rbi: stats.rbi ?? 0,
            avg: player.seasonStats?.batting?.avg || '.000'
        };
    }).filter(Boolean);

    const homeBattingStats = homeBatters.map(id => {
        const player = homePlayers[`ID${id}`];
        if (!player || !player.stats.batting) return null;
        const stats = player.stats.batting;
        return {
            name: formatPlayerName(player.person.fullName),
            position: player.position.abbreviation,
            ab: stats.atBats ?? 0,
            r: stats.runs ?? 0,
            h: stats.hits ?? 0,
            rbi: stats.rbi ?? 0,
            avg: player.seasonStats?.batting?.avg || '.000'
        };
    }).filter(Boolean);

    // Get pitching stats
    const awayPitchingStats = awayPitchers.map(id => {
        const player = players[`ID${id}`];
        if (!player || !player.stats.pitching) return null;
        const stats = player.stats.pitching;
        return {
            name: formatPlayerName(player.person.fullName),
            decision: getPitchingDecision(stats),
            ip: stats.inningsPitched || '0',
            h: stats.hits ?? 0,
            r: stats.runs ?? 0,
            er: stats.earnedRuns ?? 0,
            bb: stats.baseOnBalls ?? 0,
            so: stats.strikeOuts ?? 0,
            np: stats.numberOfPitches ?? 0,
            era: player.seasonStats?.pitching?.era || '0.00'
        };
    }).filter(Boolean);

    const homePitchingStats = homePitchers.map(id => {
        const player = homePlayers[`ID${id}`];
        if (!player || !player.stats.pitching) return null;
        const stats = player.stats.pitching;
        return {
            name: formatPlayerName(player.person.fullName),
            decision: getPitchingDecision(stats),
            ip: stats.inningsPitched || '0',
            h: stats.hits ?? 0,
            r: stats.runs ?? 0,
            er: stats.earnedRuns ?? 0,
            bb: stats.baseOnBalls ?? 0,
            so: stats.strikeOuts ?? 0,
            np: stats.numberOfPitches ?? 0,
            era: player.seasonStats?.pitching?.era || '0.00'
        };
    }).filter(Boolean);

    // Calculate totals
    const awayBatTotals = calculateBattingTotals(awayBattingStats);
    const homeBatTotals = calculateBattingTotals(homeBattingStats);

    return `
        <div class="player-stats">
            <div class="batting-stats">
                <div class="stats-columns">
                    <div class="stats-column">
                        <table class="player-table">
                            <thead>
                                <tr>
                                    <th class="player-name-col">${awayAbbrev}</th>
                                    <th>AB</th>
                                    <th>R</th>
                                    <th>H</th>
                                    <th>BI</th>
                                    <th>Avg.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${awayBattingStats.map(p => `
                                    <tr>
                                        <td class="player-name-col">${p.name} ${p.position.toLowerCase()}</td>
                                        <td>${p.ab}</td>
                                        <td>${p.r}</td>
                                        <td>${p.h}</td>
                                        <td>${p.rbi}</td>
                                        <td>${p.avg}</td>
                                    </tr>
                                `).join('')}
                                <tr class="totals-row">
                                    <td class="player-name-col">Totals</td>
                                    <td><strong>${awayBatTotals.ab}</strong></td>
                                    <td><strong>${awayBatTotals.r}</strong></td>
                                    <td><strong>${awayBatTotals.h}</strong></td>
                                    <td><strong>${awayBatTotals.rbi}</strong></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="stats-column">
                        <table class="player-table">
                            <thead>
                                <tr>
                                    <th class="player-name-col">${homeAbbrev}</th>
                                    <th>AB</th>
                                    <th>R</th>
                                    <th>H</th>
                                    <th>BI</th>
                                    <th>Avg.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${homeBattingStats.map(p => `
                                    <tr>
                                        <td class="player-name-col">${p.name} ${p.position.toLowerCase()}</td>
                                        <td>${p.ab}</td>
                                        <td>${p.r}</td>
                                        <td>${p.h}</td>
                                        <td>${p.rbi}</td>
                                        <td>${p.avg}</td>
                                    </tr>
                                `).join('')}
                                <tr class="totals-row">
                                    <td class="player-name-col">Totals</td>
                                    <td><strong>${homeBatTotals.ab}</strong></td>
                                    <td><strong>${homeBatTotals.r}</strong></td>
                                    <td><strong>${homeBatTotals.h}</strong></td>
                                    <td><strong>${homeBatTotals.rbi}</strong></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="pitching-stats">
                <table class="pitcher-table">
                    <thead>
                        <tr>
                            <th class="pitcher-name-col">${awayAbbrev}</th>
                            <th>IP</th>
                            <th>H</th>
                            <th>R</th>
                            <th>ER</th>
                            <th>BB</th>
                            <th>SO</th>
                            <th>NP</th>
                            <th>ERA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${awayPitchingStats.map(p => `
                            <tr>
                                <td class="pitcher-name-col">${p.name}${p.decision}</td>
                                <td>${p.ip}</td>
                                <td>${p.h}</td>
                                <td>${p.r}</td>
                                <td>${p.er}</td>
                                <td>${p.bb}</td>
                                <td>${p.so}</td>
                                <td>${p.np}</td>
                                <td>${p.era}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <table class="pitcher-table">
                    <thead>
                        <tr>
                            <th class="pitcher-name-col">${homeAbbrev}</th>
                            <th>IP</th>
                            <th>H</th>
                            <th>R</th>
                            <th>ER</th>
                            <th>BB</th>
                            <th>SO</th>
                            <th>NP</th>
                            <th>ERA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${homePitchingStats.map(p => `
                            <tr>
                                <td class="pitcher-name-col">${p.name}${p.decision}</td>
                                <td>${p.ip}</td>
                                <td>${p.h}</td>
                                <td>${p.r}</td>
                                <td>${p.er}</td>
                                <td>${p.bb}</td>
                                <td>${p.so}</td>
                                <td>${p.np}</td>
                                <td>${p.era}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Helper functions
function formatPlayerName(fullName) {
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0][0];
    return `${firstInitial}.${lastName}`;
}

function getPitchingDecision(stats) {
    if (stats.wins > 0) return `, W`;
    if (stats.losses > 0) return `, L`;
    if (stats.saves > 0) return `, S`;
    if (stats.holds > 0) return `, H`;
    if (stats.blownSaves > 0) return `, BS`;
    return '';
}

function calculateBattingTotals(batters) {
    return batters.reduce((acc, p) => ({
        ab: acc.ab + p.ab,
        r: acc.r + p.r,
        h: acc.h + p.h,
        rbi: acc.rbi + p.rbi
    }), { ab: 0, r: 0, h: 0, rbi: 0 });
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

    const linescore = game.linescore;
    const innings = linescore?.innings || [];

    const awayRuns = linescore?.teams?.away?.runs ?? 0;
    const homeRuns = linescore?.teams?.home?.runs ?? 0;
    const awayHits = linescore?.teams?.away?.hits ?? 0;
    const homeHits = linescore?.teams?.home?.hits ?? 0;
    const awayErrors = linescore?.teams?.away?.errors ?? 0;
    const homeErrors = linescore?.teams?.home?.errors ?? 0;

    const awayAbbrev = getAbbrev(awayTeam.team.name);
    const homeAbbrev = getAbbrev(homeTeam.team.name);

    const gamePk = game.gamePk;

    // For scheduled games
    if (status.type === 'scheduled') {
        const gameTime = formatGameTime(game.gameDate);
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
                    <div class="venue">${venue}</div>
                </div>
            </div>
        `;
    }

    // Build inning-by-inning display
    const numInnings = Math.max(9, innings.length);
    let inningScores = '';

    for (let i = 1; i <= numInnings; i++) {
        const inning = innings[i - 1];
        const awayScore = inning?.away?.runs ?? '';
        const homeScore = inning?.home?.runs ?? '';

        // Group innings into sets of 3
        if (i === 1 || i === 4 || i === 7 || i === 10) {
            inningScores += '<span class="inning-group">';
        }
        inningScores += `<span class="inning-score">${awayScore}</span>`;
        if (i === 3 || i === 6 || i === 9 || i === numInnings) {
            inningScores += '</span>';
        }
    }

    let homeInningScores = '';
    for (let i = 1; i <= numInnings; i++) {
        const inning = innings[i - 1];
        const homeScore = inning?.home?.runs ?? '';

        if (i === 1 || i === 4 || i === 7 || i === 10) {
            homeInningScores += '<span class="inning-group">';
        }
        homeInningScores += `<span class="inning-score">${homeScore}</span>`;
        if (i === 3 || i === 6 || i === 9 || i === numInnings) {
            homeInningScores += '</span>';
        }
    }

    // Status text
    let statusText = status.text;
    if (status.type === 'live' && linescore?.currentInning) {
        statusText = `${linescore.inningState} ${linescore.currentInning}`;
    }

    const showExpandBtn = status.type === 'final' || status.type === 'live';

    return `
        <div class="game-card">
            <div class="game-title-bar">
                <span class="game-title">${awayAbbrev} ${awayRuns}, ${homeAbbrev} ${homeRuns}</span>
                <span class="status ${status.type}">${statusText}</span>
            </div>

            <div class="linescore-compact">
                <div class="linescore-row">
                    <span class="team-name">${awayTeam.team.name}</span>
                    <span class="innings">${inningScores}</span>
                    <span class="total">&mdash;${awayRuns}</span>
                    <span class="rhe">${awayHits}</span>
                    <span class="rhe">${awayErrors}</span>
                </div>
                <div class="linescore-row">
                    <span class="team-name">${homeTeam.team.name}</span>
                    <span class="innings">${homeInningScores}</span>
                    <span class="total">&mdash;${homeRuns}</span>
                    <span class="rhe">${homeHits}</span>
                    <span class="rhe">${homeErrors}</span>
                </div>
            </div>

            ${showExpandBtn ? `
                <div class="expand-section">
                    <button class="expand-btn" id="toggle-${gamePk}"
                            onclick="togglePlayerStats(${gamePk}, '${awayTeam.team.name}', '${homeTeam.team.name}')">
                        Show Player Stats
                    </button>
                </div>
                <div class="player-stats-container" id="stats-${gamePk}"></div>
            ` : ''}
        </div>
    `;
}

// Get game status
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

// Show/hide loading
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

// Make togglePlayerStats available globally
window.togglePlayerStats = togglePlayerStats;

// Start the app
init();
