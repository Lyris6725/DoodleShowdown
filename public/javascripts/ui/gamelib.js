
async function refresh() {
    if (GameInfo.game.player.state == "Waiting") { 
        // Every time we are waiting
        await getGameInfo();   
        await getDecksInfo();  
        if (GameInfo.game.player.state != "Waiting") {
            // The moment we pass from waiting to play
            GameInfo.prepareUI();
            let res = await requestTurnResult(GameInfo.game.id);
            GameInfo.resultString = res.msg;
            //console.log('Result string:', GameInfo.resultString);
        }
    } 
    // Nothing to do when we are playing since we control all that happens 
    // so no update is needed from the server
}

function preload() {
    GameInfo.images.card = loadImage('/assets/card_template.png');
    //GameInfo.resultString = ("Result will be displayed here.");
}


async function setup() {
    let canvas = createCanvas(GameInfo.width, GameInfo.height);
    canvas.parent('game');
    // preload  images
    


    await  getGameInfo();
    setInterval(refresh,2000);

    //buttons (create a separated function if they are many)
    GameInfo.endturnButton = createButton('End Turn');
    GameInfo.endturnButton.parent('game');
    GameInfo.endturnButton.position(50, GameInfo.height-50);
    GameInfo.endturnButton.mousePressed(endturnAction);
    GameInfo.endturnButton.addClass('game')

    await getDecksInfo();

    GameInfo.prepareUI();
    

    GameInfo.loading = false;
}

function draw() {
    background(220);
    if (GameInfo.loading) {
        textAlign(CENTER, CENTER);
        textSize(40);
        fill('black');
        text('Loading...', GameInfo.width/2, GameInfo.height/2);
    } else {
        GameInfo.scoreBoard.draw();
        GameInfo.playerDeck.draw();
        GameInfo.oppDeck.draw();
        // Draw the result string
        textAlign(CENTER, CENTER);
        textSize(20);
        fill('black');
        text(GameInfo.resultString, GameInfo.width/2, 50);
    }
    
}

async function mouseClicked() {
    if ( GameInfo.playerDeck) {
        GameInfo.playerDeck.click();
    }
}

