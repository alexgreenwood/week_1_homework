const CUBS_ID = 112;
const CUBS_BLUE = new Color("#0E3386");
const TEXT_DIM = new Color("#AACCFF");

async function fetchGame() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId="
      + String(CUBS_ID) + "&date=" + today + "&hydrate=linescore";
    const req = new Request(url);
    const data = await req.loadJSON();
    if (!data || !data.dates || data.dates.length === 0) return null;
    const games = data.dates[0].games;
    if (!games || games.length === 0) return null;
    return games[0];
  } catch (e) {
    return null;
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
  w.backgroundColor = CUBS_BLUE;
  w.setPadding(14, 16, 14, 16);
  const header = w.addText("CUBS");
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
