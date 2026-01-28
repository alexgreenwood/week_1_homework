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
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;

    datePicker.addEventListener('change', fetchGames);
    refreshBtn.addEventListener('click', fetchGames);

    fetchGames();
    setInterval(fetchGames, 60000); // Refresh every 60 seconds
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

        await displayGames(games);
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
    try {
        const response = await fetch(
            `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`
        );
        if (!response.ok) throw new Error('Failed to fetch boxscore');
        return await response.json();
    } catch (error) {
        console.error('Error fetching boxscore:', error);
        return null;
    }
}

// Display games in the UI
async function displayGames(games) {
    if (games.length === 0) {
        noGames.style.display = 'block';
        gamesContainer.innerHTML = '';
        return;
    }

    noGames.style.display = 'none';

    // Process all games and fetch boxscores for completed/live games
    const gameCards = await Promise.all(games.map(game => createGameCard(game)));
    gamesContainer.innerHTML = gameCards.join('');
}

// Get team abbreviation
function getAbbrev(teamName) {
    return TEAM_ABBREV[teamName] || teamName.substring(0, 3).toUpperCase();
}

// Create HTML for a single game card with box score
async function createGameCard(game) {
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

    // For scheduled games - simple preview
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

    // Build linescore
    const numInnings = Math.max(9, innings.length);
    let awayInningScores = '';
    let homeInningScores = '';

    for (let i = 1; i <= numInnings; i++) {
        const inning = innings[i - 1];
        const awayScore = inning?.away?.runs ?? '';
        const homeScore = inning?.home?.runs ?? '';

        if (i === 4 || i === 7 || i === 10) {
            awayInningScores += '&nbsp;&nbsp;';
            homeInningScores += '&nbsp;&nbsp;';
        }
        awayInningScores += `<span class="inn">${awayScore}</span>`;
        homeInningScores += `<span class="inn">${homeScore}</span>`;
    }

    // Status text
    let statusText = status.text;
    if (status.type === 'live' && linescore?.currentInning) {
        statusText = `${linescore.inningState} ${linescore.currentInning}`;
    }

    // Fetch boxscore for player stats
    const boxscore = await fetchBoxscore(gamePk);
    let playerStatsHTML = '';

    if (boxscore) {
        playerStatsHTML = createPlayerStatsHTML(boxscore, awayTeam.team.name, homeTeam.team.name, awayInningScores, homeInningScores, awayRuns, homeRuns, awayHits, homeHits, awayErrors, homeErrors);
    }

    return `
        <div class="game-card">
            <div class="game-title-bar">
                <span class="game-title">${awayAbbrev} ${awayRuns}, ${homeAbbrev} ${homeRuns}</span>
                <span class="status ${status.type}">${statusText}</span>
            </div>
            ${playerStatsHTML}
        </div>
    `;
}

// Create player stats HTML matching newspaper style
function createPlayerStatsHTML(boxscore, awayName, homeName, awayInningScores, homeInningScores, awayRuns, homeRuns, awayHits, homeHits, awayErrors, homeErrors) {
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
            position: player.position.abbreviation.toLowerCase(),
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
            position: player.position.abbreviation.toLowerCase(),
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
        const seasonStats = player.seasonStats?.pitching || {};
        return {
            name: formatPlayerName(player.person.fullName),
            decision: getPitchingDecision(stats),
            record: `${seasonStats.wins || 0}-${seasonStats.losses || 0}`,
            ip: stats.inningsPitched || '0',
            h: stats.hits ?? 0,
            r: stats.runs ?? 0,
            er: stats.earnedRuns ?? 0,
            bb: stats.baseOnBalls ?? 0,
            so: stats.strikeOuts ?? 0,
            np: stats.numberOfPitches ?? 0,
            era: seasonStats.era || '0.00'
        };
    }).filter(Boolean);

    const homePitchingStats = homePitchers.map(id => {
        const player = homePlayers[`ID${id}`];
        if (!player || !player.stats.pitching) return null;
        const stats = player.stats.pitching;
        const seasonStats = player.seasonStats?.pitching || {};
        return {
            name: formatPlayerName(player.person.fullName),
            decision: getPitchingDecision(stats),
            record: `${seasonStats.wins || 0}-${seasonStats.losses || 0}`,
            ip: stats.inningsPitched || '0',
            h: stats.hits ?? 0,
            r: stats.runs ?? 0,
            er: stats.earnedRuns ?? 0,
            bb: stats.baseOnBalls ?? 0,
            so: stats.strikeOuts ?? 0,
            np: stats.numberOfPitches ?? 0,
            era: seasonStats.era || '0.00'
        };
    }).filter(Boolean);

    // Calculate totals
    const awayBatTotals = calculateBattingTotals(awayBattingStats);
    const homeBatTotals = calculateBattingTotals(homeBattingStats);

    return `
        <div class="newspaper-boxscore">
            <!-- Batting Stats Side by Side -->
            <div class="batting-section">
                <table class="batting-table">
                    <thead>
                        <tr>
                            <th class="name-col">${awayAbbrev}</th>
                            <th>AB</th>
                            <th>R</th>
                            <th>H</th>
                            <th>BI</th>
                            <th>Avg.</th>
                            <th class="spacer"></th>
                            <th class="name-col">${homeAbbrev}</th>
                            <th>AB</th>
                            <th>R</th>
                            <th>H</th>
                            <th>BI</th>
                            <th>Avg.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${createBattingRows(awayBattingStats, homeBattingStats)}
                        <tr class="totals-row">
                            <td class="name-col">Totals</td>
                            <td><b>${awayBatTotals.ab}</b></td>
                            <td><b>${awayBatTotals.r}</b></td>
                            <td><b>${awayBatTotals.h}</b></td>
                            <td><b>${awayBatTotals.rbi}</b></td>
                            <td></td>
                            <td class="spacer"></td>
                            <td class="name-col">Totals</td>
                            <td><b>${homeBatTotals.ab}</b></td>
                            <td><b>${homeBatTotals.r}</b></td>
                            <td><b>${homeBatTotals.h}</b></td>
                            <td><b>${homeBatTotals.rbi}</b></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Linescore -->
            <div class="linescore-section">
                <table class="linescore-table">
                    <tbody>
                        <tr>
                            <td class="ls-team">${awayName}</td>
                            <td class="ls-innings">${awayInningScores}</td>
                            <td class="ls-dash">&mdash;${awayRuns}</td>
                            <td class="ls-rhe">${awayHits}</td>
                            <td class="ls-rhe">${awayErrors}</td>
                        </tr>
                        <tr>
                            <td class="ls-team">${homeName}</td>
                            <td class="ls-innings">${homeInningScores}</td>
                            <td class="ls-dash">&mdash;${homeRuns}</td>
                            <td class="ls-rhe">${homeHits}</td>
                            <td class="ls-rhe">${homeErrors}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pitching Stats -->
            <div class="pitching-section">
                <table class="pitching-table">
                    <thead>
                        <tr>
                            <th class="pitcher-col">${awayAbbrev}</th>
                            <th>IP</th>
                            <th>H</th>
                            <th>R</th>
                            <th>ER</th>
                            <th>BB</th>
                            <th>SO</th>
                            <th class="spacer-small"></th>
                            <th>NP</th>
                            <th>ERA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${awayPitchingStats.map(p => `
                            <tr>
                                <td class="pitcher-col">${p.name}${p.decision ? `, ${p.decision}, ${p.record}` : ''}</td>
                                <td>${p.ip}</td>
                                <td>${p.h}</td>
                                <td>${p.r}</td>
                                <td>${p.er}</td>
                                <td>${p.bb}</td>
                                <td>${p.so}</td>
                                <td class="spacer-small"></td>
                                <td>${p.np}</td>
                                <td>${p.era}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <table class="pitching-table">
                    <thead>
                        <tr>
                            <th class="pitcher-col">${homeAbbrev}</th>
                            <th>IP</th>
                            <th>H</th>
                            <th>R</th>
                            <th>ER</th>
                            <th>BB</th>
                            <th>SO</th>
                            <th class="spacer-small"></th>
                            <th>NP</th>
                            <th>ERA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${homePitchingStats.map(p => `
                            <tr>
                                <td class="pitcher-col">${p.name}${p.decision ? `, ${p.decision}, ${p.record}` : ''}</td>
                                <td>${p.ip}</td>
                                <td>${p.h}</td>
                                <td>${p.r}</td>
                                <td>${p.er}</td>
                                <td>${p.bb}</td>
                                <td>${p.so}</td>
                                <td class="spacer-small"></td>
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

// Create batting rows side by side
function createBattingRows(awayStats, homeStats) {
    const maxRows = Math.max(awayStats.length, homeStats.length);
    let html = '';

    for (let i = 0; i < maxRows; i++) {
        const away = awayStats[i];
        const home = homeStats[i];

        html += '<tr>';

        if (away) {
            html += `
                <td class="name-col">${away.name} ${away.position}</td>
                <td>${away.ab}</td>
                <td>${away.r}</td>
                <td>${away.h}</td>
                <td>${away.rbi}</td>
                <td>${away.avg}</td>
            `;
        } else {
            html += '<td></td><td></td><td></td><td></td><td></td><td></td>';
        }

        html += '<td class="spacer"></td>';

        if (home) {
            html += `
                <td class="name-col">${home.name} ${home.position}</td>
                <td>${home.ab}</td>
                <td>${home.r}</td>
                <td>${home.h}</td>
                <td>${home.rbi}</td>
                <td>${home.avg}</td>
            `;
        } else {
            html += '<td></td><td></td><td></td><td></td><td></td><td></td>';
        }

        html += '</tr>';
    }

    return html;
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
    if (stats.wins > 0) return 'W';
    if (stats.losses > 0) return 'L';
    if (stats.saves > 0) return 'S';
    if (stats.holds > 0) return 'H';
    if (stats.blownSaves > 0) return 'BS';
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

// Start the app
init();
