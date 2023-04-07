const pool = require("../config/database");

var nCards = 5;

function fromDBCardToCard(dbCard) {
    return new Card(dbCard.ugc_id,
        dbCard.ct_name,
        new CardType(dbCard.ct_id, dbCard.ct_name),
        dbCard.ugc_value, dbCard.ugc_played);
}

class CardType {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Card {
    constructor(cardId, name, type, value, played) {
        this.cardId = cardId;
        this.name = name;
        this.type = type;
        this.value = value;
        this.played = played;
    }

    static async genCard(playerId) {
        try {
            let [cards] = await pool.query(`SELECT * FROM card INNER JOIN card_type ON crd_type_id = ct_id`);
            let rndCardType = fromDBCardToCard(cards[Math.floor(Math.random() * 3) + 1]);
            let rndCardValue = fromDBCardToCard(cards[Math.floor(Math.random() * 10) + 1]);
            // insert the card
            let [result] = await pool.query(`INSERT INTO user_game_card (ugc_user_game_id, ugc_type_id, ugc_value, ugc_active)
                  VALUES (?, ?, ?, ?)`, [playerId, rndCardType.type.id, rndCardValue.value, true]);
            return { status: 200, result: fromDBCardToCard({ugc_id: result.insertId, ct_name: rndCardType.type.name, ct_id: rndCardType.type.id, ugc_value: rndCardValue.value, ugc_played: false}) };
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
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
            for (let i=0; i < nCards; i++) {
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
    static async resetPlayerDeck(playerId) {
        try {
            let [result] = await pool.query(`DELETE FROM user_game_card WHERE ugc_user_game_id = ?`, [playerId]);
            return {status:200, result: {msg:"All cards removed"}};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }

    //leave it alone for now
    static async getMatchDeck(game) {
        try {
            let [dbcards] = await pool.query(`Select * from card
            inner join card_type on ugc_type_id = ct_id 
            inner join user_game_card on ugc_crd_id = crd_id
            where ugc_user_game_id = ? or ugc_user_game_id = ?`, 
                [game.player.id, game.opponents[0].id]);
            let playerCards = [];
            let oppCards = [];
            for(let dbcard of dbcards) {
                let card = fromDBCardToCard(dbcard);
                if (dbcard.ugc_user_game_id == game.player.id) {
                    playerCards.push(card);
                } else {
                    oppCards.push(card);
                }
            }
            return {status:200, result: new MatchDecks(playerCards,oppCards)};
        } catch (err) {
            console.log(err);
            return { status: 500, result: err };
        }
    }
    
    static async playCard(game, cardId) {
        try {
          // get the card and check if it is active for the player
          const [dbCard] = await pool.query(`SELECT * FROM user_game_card 
                                             INNER JOIN card_type ON ugc_type_id = ct_id
                                             WHERE ugc_user_game_id = ? 
                                             AND ugc_id = ? AND ugc_active = 1`, 
                                             [game.player.id, cardId]);
          if (dbCard.length === 0) {
            return {status: 404, result: {msg: "Card not found or not active for this player"}};
          }   
      
          const card = fromDBCardToCard(dbCard[0]);
      
          // Mark the card as played
          await pool.query("UPDATE user_game_card SET ugc_played = 1 WHERE ugc_id = ?", [cardId]);
      
          // Remove the card from the player's deck
          await pool.query("DELETE FROM user_game_card WHERE ugc_id = ?", [cardId]);
      
          // Return the played card and the updated game state
          return {status: 200, result: {playedCard: card, game: game}};
        } catch (err) {
          console.log(err);
          return {status: 500, result: err};
        }
      }
      
    
}

module.exports = MatchDecks;