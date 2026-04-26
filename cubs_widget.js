// Chicago Cubs Score Widget for Scriptable
// Install: copy this script into the Scriptable app on your iPhone

const CUBS_TEAM_ID = 112;
const CUBS_BLUE = new Color("#0E3386");
const CUBS_RED = new Color("#CC3433");
const TEXT_DIM = new Color("#AACCFF");

async function fetchGame() {
  const today = new Date().toISOString().split("T")[0];
  const url =
    `https://statsapi.mlb.com/api/v1/schedule` +
    `?sportId=1&teamId=${CUBS_TEAM_ID}&date=${today}&hydrate=linescore`;
  const data = await new Request(url).loadJSON();
  if (!data.dates?.length || !data.dates[0].games?.length) return null;
  return data.dates[0].games[0];
}

function shortName(fullName) {
  return fullName === "Chicago Cubs" ? "Cubs" : fullName.split(" ").pop();
}

function gameStatus(game) {
  const state = game.status.detailedState;
  const ls = game.linescore;

  if (state === "In Progress" && ls) {
    return `${ls.inningHalf} ${ls.currentInningOrdinal}`;
  }
  if (state === "Final" || state === "Game Over") {
    return "Final";
  }
  if (["Scheduled", "Pre-Game", "Warmup"].includes(state)) {
    const t = new Date(game.gameDate);
    return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return state;
}

function addTeamRow(parent, name, score, isCubs) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const nameText = row.addText(name);
  nameText.font = isCubs ? Font.boldSystemFont(15) : Font.systemFont(15);
  nameText.textColor = Color.white();

  row.addSpacer();

  const scoreText = row.addText(score !== undefined && score !== null ? String(score) : "-");
  scoreText.font = Font.boldSystemFont(15);
  scoreText.textColor = Color.white();
}

async function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = CUBS_BLUE;
  w.setPadding(14, 16, 14, 16);

  const header = w.addText("⚾  CUBS");
  header.font = Font.boldSystemFont(11);
  header.textColor = TEXT_DIM;

  w.addSpacer(8);

  const game = await fetchGame();

  if (!game) {
    const msg = w.addText("No game today");
    msg.font = Font.systemFont(14);
    msg.textColor = Color.white();
    return w;
  }

  const away = game.teams.away;
  const home = game.teams.home;
  const cubsAreHome = home.team.id === CUBS_TEAM_ID;

  addTeamRow(w, shortName(away.team.name), away.score, !cubsAreHome);
  w.addSpacer(6);
  addTeamRow(w, shortName(home.team.name), home.score, cubsAreHome);

  w.addSpacer(8);

  const status = w.addText(gameStatus(game));
  status.font = Font.systemFont(11);
  status.textColor = TEXT_DIM;

  return w;
}

const widget = await buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}

Script.complete();
