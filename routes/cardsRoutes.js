const express = require('express');
const router = express.Router();
const MatchDecks = require("../models/cardsModel");
const auth = require("../middleware/auth");

// Get the cards for the authenticated user
router.get('/auth', auth.verifyAuth, async function (req, res, next) {
    try {
        console.log("Get cards of the authenticated user");
        if (!req.game || req.game.opponents.length == 0) {
            res.status(400).send({msg:"Your are not in a game or are still waiting for another player."});
        }
        const playerCards = await MatchDecks.getPlayerCards(req.user.username);
        res.status(200).send(playerCards);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Play a card from the authenticated user's deck
router.patch('/play', auth.verifyAuth, async function (req, res, next) {
    try {
        console.log("Play card with id: ",req.body.cardId);
        if (!req.game || req.game.opponents.length == 0) {
            res.status(400).send({msg:"Your are not in a game or are still waiting for another player."});
        }
        const playerId = req.user.username;
        const cardId = req.body.cardId;
        const result = await MatchDecks.playCard(playerId, cardId);
        res.status(result.status).send(result.result);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;
