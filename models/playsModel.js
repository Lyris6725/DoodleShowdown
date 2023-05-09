const pool = require("../config/database");

const MatchDecks = require("./decksModel");
const ScoreBoardLine = require("./scoreboardModel");
const Settings = require("./gameSettings");

 // auxiliary function to check if the game ended 
 async function checkEndGame(game) {
    return game.turn >= Play.maxNumberTurns;
}


class Play {

   
    // Just a to have a way to determine end of game
    static maxNumberTurns = 3; //Maximum number of turns allowed in a game (we'll probably change this over the cap as a fail safe for too many draws)

    // we consider all verifications were made
    static async startGame(game) {
        try {
            // Randomly determines who starts    
            let myTurn = (Math.random() < 0.5);
            let p1Id = myTurn ? game.player.id : game.opponents[0].id;
            let p2Id = myTurn ? game.opponents[0].id : game.player.id;

            // Player that start changes to the state Playing and order 1 
            await pool.query(`Update user_game set ug_state_id=?,ug_order=? where ug_id = ?`, [2, 1, p1Id]);
            // Player that is second changes to order 2
            await pool.query(`Update user_game set ug_order=? where ug_id = ?`, [2, p2Id]);

            // Changing the game state to start
            await pool.query(`Update game set gm_state_id=? where gm_id = ?`, [2, game.id]);

            // ---- Specific rules for each game start bellow
            
            // Player that starts gets new cards
            await MatchDecks.genPlayerDeck(p1Id);


        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    // This considers that only one player plays at each moment, 
    // so ending my turn starts the other players turn
    // We consider the following verifications were already made:
    // - The user is authenticated
    // - The user has a game running
    // NOTE: This might be the place to check for victory, but it depends on the game
    static async endTurn(game) {
        try {
            // Change player state to waiting (1)
            await pool.query(`Update user_game set ug_state_id=? where ug_id = ?`,
                [1, game.player.id]);
            // Change opponent state to playing (2)
            await pool.query(`Update user_game set ug_state_id=? where ug_id = ?`,
                [2, game.opponents[0].id]);
            
            // removes the cards of the player that ended and get new cards to the one that will start
            
            //await MatchDecks.genPlayerDeck(game.opponents[0].id);
            //await ScoreBoardLine.getScoreBoardLine(game, playerIds);
            
            // Both players played

            let resultString="Your turn ended.";
                      
            if (game.player.order == 2) {
                // Criteria to check if game ended
                if (await checkEndGame(game)) {
                    return await Play.endGame(game);
                } else {
                    let [activePlyCards] = await pool.query(`Select * from card 
            inner join card_type on crd_type_id = ct_id
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? and ugc_played=1`, 
                [game.player.id,]);


                let [activeOppCards] = await pool.query(`Select * from card 
            inner join card_type on crd_type_id = ct_id
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? and ugc_played=1`, 
                [game.opponents[0].id])
                    
                        // Check if both cards have the same type
                         if (activePlyCards[0].crd_type_id === activeOppCards[0].crd_type_id) {
                            if (activePlyCards[0].crd_value === activeOppCards[0].crd_value) {
                                resultString = `Both players played ${activePlyCards[0].ct_name} cards. Draw.`;
                            } else if (activePlyCards[0].crd_value > activeOppCards[0].crd_value) {
                               resultString = `${game.player.name} won with a ${activePlyCards[0].ct_name} card with value ${activePlyCards[0].crd_value} against ${game.opponents[0].name}'s ${activeOppCards[0].ct_name} card with value ${activeOppCards[0].crd_value}.`;
                                //await ScoreBoardLine.addScore(game, game.player.id, 1);
                            } else {
                                resultString = `${game.opponents[0].name} won with a ${activeOppCards[0].ct_name} card with value ${activeOppCards[0].crd_value} against ${game.player.name}'s ${activePlyCards[0].ct_name} card with value ${activePlyCards[0].crd_value}.`;
                                //await ScoreBoardLine.addScore(game, game.opponents[0].id, 1);
                            }
                        } else {
                            if (
                                (activePlyCards[0].crd_type_id === 1 && activeOppCards[0].crd_type_id === 3) ||
                                (activePlyCards[0].crd_type_id === 2 && activeOppCards[0].crd_type_id === 1) ||
                                (activePlyCards[0].crd_type_id === 3 && activeOppCards[0].crd_type_id === 2)
                            ) {
                                resultString = `${game.player.name} won with a ${activePlyCards[0].ct_name} card against ${game.opponents[0].name}'s ${activeOppCards[0].ct_name} card.`;
                                //await ScoreBoardLine.addScore(game, game.player.id, 1);
                            } else {
                                resultString = `${game.opponents[0].name} won with a ${activeOppCards[0].ct_name} card against ${game.player.name}'s ${activePlyCards[0].ct_name} card.`;
                                //await ScoreBoardLine.addScore(game, game.opponents[0].id, 1);
                            }
                        }
                        
                        // Mark both cards as played
                        //await pool.query(`Update card set played=1 where card_id in (?, ?)`,
                         //   [playerCard.id, opponentCard.id]);
                }
                
                await MatchDecks.removePlayedCard(game.player.id);
                // Increase the number of turns and continue 
                await pool.query(`Update game set gm_turn=gm_turn+1 where gm_id = ?`,
                    [game.id]);
            }
    
            return { status: 200, result: { msg: resultString } };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    

    /*

    */

    // Makes all the calculation needed to end and score the game
    static async endGame(game) {
        try {
            // Both players go to score phase (id = 3)
            let sqlPlayer = `Update user_game set ug_state_id = ? where ug_id = ?`;
            await pool.query(sqlPlayer, [3, game.player.id]);
            await pool.query(sqlPlayer, [3, game.opponents[0].id]);
            // Set game to finished (id = 3)
            await pool.query(`Update game set gm_state_id=? where gm_id = ?`, [3, game.id]);

            // Insert score lines with the state and points.
            // For this template both are  tied (id = 1) and with one point 
            let sqlScore = `Insert into scoreboard (sb_user_game_id,sb_state_id,sb_points) values (?,?,?)`;
            await pool.query(sqlScore, [game.player.id,1,1]);
            await pool.query(sqlScore, [game.opponents[0].id,1,1]);

            return { status: 200, result: { msg: "Game ended. Check scores." } };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
}

module.exports = Play;