
async function getGameInfo() {
    let result = await requestPlayerGame();
    if (!result.successful) {
        alert("Something is wrong with the game please login again!");
        window.location.pathname = "index.html";
    } else {
        GameInfo.game = result.game;
        if (GameInfo.scoreBoard) GameInfo.scoreBoard.update(GameInfo.game); 
        else GameInfo.scoreBoard = new ScoreBoard(GameInfo.game);
    }
}


async function getDecksInfo() {
    let result = await requestDecks();
    if (!result.successful) {
        alert("Something is wrong with the game please login again!");
        window.location.pathname = "index.html";
    } else {
        GameInfo.matchDecks = result.decks;
        if (GameInfo.playerDeck) GameInfo.playerDeck.update(GameInfo.matchDecks.mycards); 
        else GameInfo.playerDeck = new Deck("Your cards",
            GameInfo.matchDecks.mycards,30,300,playCard,GameInfo.images.card);
        if (GameInfo.oppDeck) GameInfo.oppDeck.update(GameInfo.matchDecks.oppcards); 
        else GameInfo.oppDeck = new Deck("Opponent cards",
            GameInfo.matchDecks.oppcards,GameInfo.width-30-Deck.nCards*Card.width,300,null,GameInfo.images.card);
    }
}



async function playCard(card) {
    let game = GameInfo.game;
    if (game.player.state == "Playing"){
    if (card.played) {
        alert("That card was already played");
    } else if ((confirm(`Do you want to play this card?`))) {
        let result = await requestPlayCard(card.deckId, card.played);
        if (result.successful) {
            await getGameInfo();
            await getDecksInfo();
            await endturnAction();
        }
        alert(result.msg);
        // if game ended we get the scores and prepare the ScoreWindow
        if (GameInfo.game.state == "Finished") {
            let result = await requestScore();
            GameInfo.scoreWindow = new ScoreWindow(50,50,GameInfo.width-100,GameInfo.height-100,result.score,closeScore);
        }
    }
   }
   else
   {
    alert("not your turn");
   }
}


async function endturnAction() {
    let result = await requestEndTurn();
    if (result.successful) {
        await  getGameInfo();

        GameInfo.resultString = result.msg;
        GameInfo.prepareUI();
    } else alert("Something went wrong when ending the turn.")
}

async function closeScore() {
    let result = await requestCloseScore();
    if (result.successful) {
        await checkGame(true); // This should send the player back to matches
    } else alert("Something went wrong when ending the turn.")
}