const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3002, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
module.exports = app;
const convertObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertListToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select * from player_details order by player_id;`;
  const playerList = await db.all(getPlayerQuery);

  response.send(playerList.map((each) => convertListToResponseObject(each)));
});
//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerIdQuery = `select * from player_details where player_id=${playerId};`;
  const Player = await db.get(playerIdQuery);
  response.send({
    playerId: Player["player_id"],
    playerName: Player["player_name"],
  });
});
//API3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const playerNameQuery = `UPDATE
    player_details
  SET
    player_name='${playerName}'
  WHERE
    player_id = ${playerId};`;
  await db.run(playerNameQuery);
  response.send("Player Details Updated");
});
//API4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchIdQuery = `select * from match_details where match_id=${matchId};`;
  const matchObject = await db.get(matchIdQuery);
  response.send(convertObjectToResponseObject(matchObject));
});
//API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `SELECT match_details.match_id,match_details.match,match_details.year from match_details inner join player_match_score on player_match_score.match_id=match_details.match_id where player_match_score.player_id=${playerId};`;
  const match_object = await db.all(getMatchQuery);
  response.send(
    match_object.map((each) => convertObjectToResponseObject(each))
  );
});
//APP6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlyerQuery = `SELECT player_details.player_id,player_details.player_name from player_details inner join player_match_score on player_match_score.player_id=player_details.player_id where player_match_score.match_id=${matchId};`;
  const player_object = await db.all(getPlyerQuery);
  response.send(player_object.map((each) => convertListToResponseObject(each)));
});
//APP 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `SELECT player_id as playerId,player_name as playerName,SUM(score) as totalScore,SUM(fours) as totalFours,SUM(sixes) as totalSixes from player_match_score natural join player_details where player_id=${playerId};`;
  const playerScore = await db.get(getPlayerScore);
  response.send(playerScore);
});
