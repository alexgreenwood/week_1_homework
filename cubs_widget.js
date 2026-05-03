const CUBS_ID = 112;
const BG_COLOR = new Color("#1a1a1a");
const TEXT_DIM = new Color("#999999");

async function fetchGame() {
  try {
    const url = "https://raw.githubusercontent.com/alexgreenwood/week_1_homework/main/cubs-game.json";
    const req = new Request(url);
    const text = await req.loadString();
    const data = JSON.parse(text);
    if (!data || !data.dates || data.dates.length === 0) return { debug: "No game today" };
    const games = data.dates[0].games;
    if (!games || games.length === 0) return { debug: "No game today" };
    return games[0];
  } catch (e) {
    return { debug: "Error: " + String(e) };
  }
}

function shortName(fullName) {
  if (!fullName || typeof fullName !== "string") return "?";
  if (fullName === "Chicago Cubs") return "Cubs";
  const parts = fullName.split(" ");
  return parts[parts.length - 1];
}

function gameStatus(game) {
  if (!game || !game.status) return "";
  const state = String(game.status.detailedState || "");
  const ls = game.linescore;
  if (state === "In Progress" && ls && ls.inningHalf && ls.currentInningOrdinal) {
    return String(ls.inningHalf) + " " + String(ls.currentInningOrdinal);
  }
  if (state === "Final" || state === "Game Over") return "Final";
  if (state === "Scheduled" || state === "Pre-Game" || state === "Warmup") {
    return new Date(game.gameDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return state;
}

function addTeamRow(parent, name, score, isBold) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const nameText = row.addText(String(name));
  nameText.font = isBold ? Font.boldSystemFont(15) : Font.systemFont(15);
  nameText.textColor = Color.white();
  row.addSpacer();
  const scoreStr = (score !== null && score !== undefined) ? String(score) : "-";
  const scoreText = row.addText(scoreStr);
  scoreText.font = Font.boldSystemFont(15);
  scoreText.textColor = Color.white();
}

async function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = BG_COLOR;
  w.setPadding(14, 16, 14, 16);
  const header = w.addText("CUBS");
  header.font = Font.boldSystemFont(11);
  header.textColor = TEXT_DIM;
  w.addSpacer(8);

  const game = await fetchGame();
  if (!game || game.debug) {
    const msg = w.addText(game && game.debug ? game.debug : "No game today");
    msg.font = Font.systemFont(11);
    msg.textColor = Color.white();
    return w;
  }

  const away = game.teams.away;
  const home = game.teams.home;
  const cubsAreHome = home.team.id === CUBS_ID;
  addTeamRow(w, shortName(away.team.name), away.score, !cubsAreHome);
  w.addSpacer(6);
  addTeamRow(w, shortName(home.team.name), home.score, cubsAreHome);
  w.addSpacer(8);

  const statusText = w.addText(gameStatus(game));
  statusText.font = Font.systemFont(11);
  statusText.textColor = TEXT_DIM;
  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();
