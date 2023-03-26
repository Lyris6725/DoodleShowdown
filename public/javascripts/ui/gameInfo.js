// All the variables for the game UI
// we only have one game info so everything is static
class GameInfo  { //everything that is shown in the game
    // settings variables
    static width = 1200;
    static height = 600;

    static loading = true;

    // data
    static game;
    //static round = this.round; //this is where the round number is going to be stored
    static images = {};
    static sounds = {};

    // rendererers
    //static scoreBoard;
    static scoreWindow;

    // buttons
    static endturnButton;
    static endgameButton;

    // Write your UI settings for each game state here
    // Call the method every time there is a game state change
    static prepareUI() {
        if (GameInfo.game.player.state == "Playing") { 
            GameInfo.endturnButton.show();
            GameInfo.endgameButton.hide();
        } else if (GameInfo.game.player.state == "Waiting") {
            GameInfo.endturnButton.hide();
            GameInfo.endgameButton.hide();
        }  else if (GameInfo.game.player.state == "Score") {
            GameInfo.endturnButton.hide();
            GameInfo.endgameButton.show();
            //GameInfo.scoreWindow.open();
        }
    }
}