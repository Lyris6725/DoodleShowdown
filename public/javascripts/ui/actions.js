
async function getGameInfo() {
    let result = await requestPlayerGame(); //matchesRequests
    if (!result.successful) {
        alert("Something is wrong with the game please login again!");
        window.location.pathname = "index.html";
    } else {
        GameInfo.game = result.game;
        /*i
        if (GameInfo.scoreBoard) GameInfo.scoreBoard.update(GameInfo.game); 
        else GameInfo.scoreBoard = new ScoreBoard(GameInfo.game);
        // if game ended we get the scores and prepare the ScoreWindow
        /*if (GameInfo.game.state == "Finished") {
            let result = await requestScore();
            GameInfo.scoreWindow = new ScoreWindow(50,50,GameInfo.width-100,GameInfo.height-100,result.score,closeScore);
        }
        */
    }
}


async function endturnAction() {
    let result = await requestEndTurn(); //gameRequests
    if (result.successful) {
        await  getGameInfo(); //actions
        GameInfo.prepareUI();
    } else alert("Something went wrong when ending the turn.")
}

async function endgameAction() {
    let result = await requestEndGame(); //gameRequests
    if (result.successful) {
        await checkGame(true); // This should send the player back to matches //verifications
    } else alert("Something went wrong when ending the game.")
}

async function updateroundAction() {
    let result = await updateCurrentRound(); //gameRequests
    if (result.successful) {
        await  getGameInfo(); //actions
        GameInfo.prepareUI();
    } else alert("Something went wrong when updating the round.")
}

/*
async function closeScore() {
    let result = await requestCloseScore();
    if (result.successful) {
        await checkGame(true); // This should send the player back to matches
    } else alert("Something went wrong when ending the turn.")
}
*/