const pool = require("../config/database");
const Settings = require("./gameSettings");

function fromDBCardToCard(dbCard) {
    return new Card(dbCard.crd_id ,dbCard.ugc_id,dbCard.crd_value,
        //dbCard.crd_name, dbCard.crd_effect, dbCard.crd_note,
        new CardType(dbCard.ct_id,dbCard.ct_name),
        dbCard.ugc_played);
}

class CardType {
    constructor (id,name) {
        this.id = id;
        this.name = name;
    }
}

class Card {
    constructor(cardId,deckId,value,type, active, played) {
        this.cardId = cardId;
        this.deckId = deckId;
        this.value = value;
        this.type = type;
        this.active = active;
        this.played = played;
    }

    static async genCard(playerId) {
        try {
            let [cards] = await pool.query(`select * from card inner join card_type on crd_type_id = ct_id`);
            let rndCard = cards[Math.floor(Math.random()*cards.length)];
            // insert the card
            let [result] = await pool.query(`Insert into user_game_card (ugc_user_game_id,ugc_crd_id)
                  values (?,?)`, [playerId,rndCard.crd_id]);
            return {status:200, result: {msg: "Generated the card"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    /*
    static async genCard(playerId) {
        try {
            let [cards] = await pool.query(`select * from card inner join card_type on crd_type_id = ct_id`);
            let rndCard = cards[Math.floor(Math.random()*cards.length)];
            // insert the card
            let [result] = await pool.query(`Insert into user_game_card (ugc_user_game_id,ugc_crd_id)
                  values (?,?,?)`, [playerId,rndCard.crd_id]);
            return {status:200, result: {msg: "Generated the card"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    */
}


class MatchDecks {
    constructor(mycards,oppcards) {
        this.mycards = mycards;
        this.oppcards = oppcards;
    }

    // No verifications are made since this is consider to be an auxiliary method
    // We consider it will only be called at the right time
    static async genPlayerDeck(playerId) {
        try {
            let cards =[];
            for (let i=0; i < Settings.nCards; i++) {
                let result = await Card.genCard(playerId);
                cards.push(result.result);
            }
            return {status:200, result: cards};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    // No verifications are made since this is consider to be an auxiliary method
    // We consider it will only be called at the right time
    static async removePlayedCard(playerId) {
        try {
            let [result] = await pool.query(`delete from user_game_card where ugc_user_game_id = ? and ugc_played = 1`, [playerId]);
            return {status:200, result: {msg:"All cards removed"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    
    static async resetPlayerDeck(playerId) {
        try {
            let [result] = await pool.query(`delete from user_game_card where ugc_user_game_id = ?`, [playerId]);
            return {status:200, result: {msg:"All cards removed"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async getMatchDeck(game) {
        try {
            let [dbcards] = await pool.query(`Select * from card
            inner join card_type on crd_type_id = ct_id 
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? or ugc_user_game_id = ?`, 
                [game.player.id, game.opponents[0].id]);
            let playerCards = [];
            let oppCards = [];
            for(let dbcard of dbcards) {
                let card = fromDBCardToCard(dbcard);
                if (dbcard.ugc_user_game_id == game.player.id) {
                    playerCards.push(card);
                } else if (game.player.state == "Resolving") {
                    if(card.played) oppCards.push(card);
                }
            }
            return {status:200, result: new MatchDecks(playerCards,oppCards)};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    static async playDeckCard(game,deckId,played) {
        try {
            // get the card and check if the card is from the player and it is active
            let [dbDeckCards] = await pool.query(`Select * from card 
            inner join card_type on crd_type_id = ct_id
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? and ugc_id = ? and ugc_played=0`, 
                [game.player.id, deckId, played]);
            if (dbDeckCards.length == 0) {
                return {status:404, result:{msg:"Card not found for this player or not active"}};
            }  
            let card =  fromDBCardToCard(dbDeckCards[0]);
            await pool.query(`UPDATE user_game_card SET ugc_played = ? WHERE ugc_id = ?`, [1, dbDeckCards[0].ugc_id]);
            return {status:200, result: {msg: "Card played!"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
      
      
    
      

    /*
    static async playDeckCard(game,deckId,played) {
        try {
            // get the card and check if the card is from the player and it is active
            let [dbDeckCards] = await pool.query(`Select * from card 
            inner join card_type on crd_type_id = ct_id
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? and ugc_id = ? and ugc_played=0`, 
                [game.player.id, deckId, played]);
            if (dbDeckCards.length == 0) {
                return {status:404, result:{msg:"Card not found for this player or not active"}};
            }  
            let card =  fromDBCardToCard(dbDeckCards[0]);
            await pool.query(`UPDATE user_game_card SET ugc_played = ? WHERE ugc_id = ?`, [1, dbDeckCards[0].ugc_id]);
            return {status:200, result: {msg: "Card played!"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    */
    
}

module.exports = MatchDecks;