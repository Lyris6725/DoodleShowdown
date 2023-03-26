const pool = require("../config/database");
const State = require("./statesModel");

// For now it is only an auxiliary class to hold data in here 
// so no need to create a model file for it
class Player { //this is for the player in game so we need their id, their name, what game state they're in and if they're the 1st or 2nd to play
    constructor(id,name,state,order,energy,energy_production) {
        this.id = id;        
        this.name = name;
        this.state= state;
        this.order = order;
        this.energy = energy;
        this.energy_production = energy_production;
    }
    export() {
        let player = new Player(this.id, this.name, this.state, this.order, this.energy, this.energy_production);
        player.name = this.name;
        player.state = this.state.export();
        player.order = this.order;
        player.energy = this.energy;
        player.energy_production = this.energy_production;
        return player;
      }      
}

class Game {
    constructor(id,round,state,player,opponents) {
        this.id = id;
        this.round = round;
        this.state = state;
        this.player = player;
        this.opponents = opponents || [];
    }
    export() {
        let game = new Game(this.id, this.round, this.state, this.player, this.opponents);
        game.state = this.state.export();
        if (this.player)
            game.player = this.player.export();
        game.opponents = this.opponents.map(o => o.export());
        return game;
    }
    
    

    // No verifications, we assume they were already made
    // This is mostly an auxiliary method
    static async fillPlayersOfGame(userId,game) {
        try {
            let [dbPlayers] = await pool.query(`Select * from user 
            inner join user_game on ug_user_id = usr_id
            inner join user_game_state on ugst_id = ug_state_id
            where ug_game_id=?`, [game.id]);
            for (let dbPlayer of dbPlayers) {
                let player = new Player(dbPlayer.ug_id,dbPlayer.usr_name,
                            new State(dbPlayer.ugst_id,dbPlayer.ugst_state),dbPlayer.ug_order,
                            dbPlayer.ug_energy, dbPlayer.ug_energy_production);
                if (dbPlayer.usr_id == userId) game.player = player;
                else game.opponents.push(player);
            }
            return {status:200, result: game};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    
        static async getPlayerActiveGame(id) {
            try {
            let [dbGames] = await pool.query(
                `Select * from game 
                inner join user_game on gm_id = ug_game_id 
                inner join user_game_state on ug_state_id = ugst_id
                inner join game_state on gm_state_id = gst_id
                where ug_user_id=? and (gst_state IN ('Waiting','Started') 
                or (gst_state = 'Finished' and ugst_state = 'Score')) `,
                [id]
            );
            if (dbGames.length === 0) {
                return { status: 200, result: false };
            }
            let dbGame = dbGames[0];
            let game = new Game(
                dbGame.gm_id,
                dbGame.gm_round,
                new State(dbGame.gst_id, dbGame.gst_state)
            );
            let result = await this.fillPlayersOfGame(id, game);
            if (result.status !== 200) {
                return result;
            }
            game = result.result;
            return { status: 200, result: game };
            } catch (err) {
            console.log(err);
            return { status: 500, result: err };
            }
        }
      

    static async getGamesWaitingForPlayers(userId) {
        try {
            let [dbGames] =
                await pool.query(`Select * from game 
                    inner join game_state on gm_state_id = gst_id
                    where gst_state = 'Waiting'`);
            let games = [];
            for (let dbGame of dbGames) {
                let game = new Game(dbGame.gm_id,dbGame.gm_round,new State(dbGame.gst_id,dbGame.gst_state)); //GM TURN SHOULD BE RENAMED
                let result = await this.fillPlayersOfGame(userId,game);
                if (result.status != 200) {
                    return result;
                }
                game = result.result;
                games.push(game);
            }
            return { status: 200, result: games} ;
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }    


    // A game is always created with one user
    // No verifications. We assume the following were already made (because of authentication):
    //  - Id exists and user exists
    //  - User does not have an active game
    static async create(userId) {
        try {
            // create the game
            let [result] = await pool.query(`Insert into game (gm_state_id) values (?)`, [1]);
            let gameId = result.insertId;
            // add the user to the game
            await pool.query(`Insert into user_game (ug_user_id,ug_game_id,ug_state_id) values (?,?,?)`, [userId, gameId, 1]);

            return {status:200, result: {msg: "You created a new game."}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    /*
    static async updateRoundModel(game) {
        try {
          await pool.query(`UPDATE game SET gm_round = gm_round+1 WHERE gm_id = ?`, [game.id]);
          return { status: 200, result: { msg: "Game round updated." } };
        } catch (err) {
          console.log(err);
          return { status: 500, result: err };
        }
    }
    */
    

  /*
  async getCurrentRound() { //tries to get the current round 
        const query = 'SELECT gm_round FROM game WHERE gm_id = ?'; //makes the query to select the round from game where the game id is equals to the game the player is on
        const result = await pool.query(query, this.id); //the result is what we return from the query and the id of the match
        return result[0].gm_round; //this returns the value of the round
        
      }
  */
      

    // No verification needed since we considered that it was already made 
    // This should have a verification from every player
    // - If only one player it would cancel
    // - Else, each player would only change his state to cancel
    // - When the last player run the cancel the game would cancel
    // (no need to be this complex since we will only use this to invalidate games)
    // Cancelled games are not scored
    static async cancel(gameId) {
        try {
          const [rows, fields] = await pool.query(
            "SELECT COUNT(*) as num_players FROM player WHERE pl_game_id = ?",
            [gameId]
          );
          if (rows[0].num_players === 0) {
            await pool.query("DELETE FROM game WHERE gm_id = ?", [gameId]);
            return { status: 200, result: { msg: "Game deleted." } };
          } else {
            await pool.query("UPDATE game SET gm_state_id = ? WHERE gm_id = ?", [
              4,
              gameId,
            ]);
            return { status: 200, result: { msg: "Game canceled." } };
          }
        } catch (err) {
          console.log(err);
          return { status: 500, result: err };
        }
      }



    // ---- These methods assume a two players game (we need it at this point) --------
          

    // We consider the following verifications were already made (because of authentication):
    //  - Id exists and user exists
    //  - User does not have an active game
    // We still need to check if the game exist and if it is waiting for players
    static async join(userId, gameId) {
        try {
            let [dbGames] = await pool.query(`Select * from game where gm_id=?`, [gameId]);
            if (dbGames.length==0)
                return {status:404, result:{msg:"Game not found"}};
            let dbGame = dbGames[0];
            if (dbGame.gm_state_id != 1) 
                return {status:400, result:{msg:"Game not waiting for other players"}};
            
            // Randomly determine who starts    
            let myTurn = (Math.random() < 0.5);

            // We join the game but the game still has not started, that will be done outside
            let [result] = await pool.query(`Insert into user_game (ug_user_id,ug_game_id,ug_state_id) values (?,?,?)`,
                        [userId, gameId, 1]);
         
            return {status:200, result: {msg: "You joined the game."}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async closeScorePlayer(game) {
        try {
            await pool.query(`Update user_game set ug_state_id = 4 where ug_id = ?`,game.player.id);
            return {status:200, result: {msg: "Score closed. You can check all scores in the Score Board page."}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async closeGame(game) {
        try {
          await pool.query(
            `Update user_game set ug_state_id = 4 where ug_id = ?`,
            game.player.id
          );
          return {
            status: 200,
            result: {
              msg:
                "Score closed. You can check all scores in the Score Board page.",
            },
          };
        } catch (err) {
          console.log(err);
          return { status: 500, result: err };
        }
      }

}

module.exports = Game;