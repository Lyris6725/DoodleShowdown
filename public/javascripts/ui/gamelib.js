
async function refresh() {
    if (GameInfo.game.player.state == "Waiting") { 
        // Every time we are waiting
        await  getGameInfo();  //actions      
        if (GameInfo.game.player.state != "Waiting") {
            // The moment we pass from waiting to play
            GameInfo.prepareUI();
        }
    } 
    // Nothing to do when we are playing since we control all that happens 
    // so no update is needed from the server
}

function preload() {

}


async function setup() {
    let canvas = createCanvas(GameInfo.width, GameInfo.height);
    canvas.parent('game');
    // preload  images
    
    await  getGameInfo(); //actions
    setInterval(refresh,1000);

    //buttons (create a separated function if they are many)
    GameInfo.endturnButton = createButton('End Turn');
    GameInfo.endturnButton.parent('game');
    GameInfo.endturnButton.position(GameInfo.width-150,GameInfo.height-50);
    GameInfo.endturnButton.mousePressed(endturnAction);
    GameInfo.endturnButton.addClass('game')

    GameInfo.endgameButton = createButton('Close Match')
    GameInfo.endgameButton.parent('game')
    GameInfo.endgameButton.position(GameInfo.width-150,GameInfo.height-100);
    GameInfo.endgameButton.mousePressed(endgameAction);
    GameInfo.endgameButton.addClass('game')

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
    } 

    else
    {
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Round " + GameInfo.game.round, GameInfo.width/12, GameInfo.height/1.1);
    text("You vs: " + GameInfo.game.opponents[0].name, GameInfo.width/2, GameInfo.height/8);
    }

}

async function mouseClicked() {
  
}

