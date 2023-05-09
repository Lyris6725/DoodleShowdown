// Actions
async function requestEndTurn() {
    try {
        const response = await fetch(`/api/plays/endturn`, 
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
          method: "PATCH"
      });
      let result = await response.json();
      return {successful: response.status == 200, msg: result.msg}; //use this
    } catch (err) {
        // Treat 500 errors here
        console.log(err);
        return {err: err};
    }
}

async function requestDecks() {
    try {
        const response = await fetch(`/api/decks/auth`);
        let result = await response.json();
        return { successful: response.status == 200,
                 unauthenticated: response.status == 401,
                 decks: result};
    } catch (err) {
        // Treat 500 errors here
        console.log(err);
        return {err: err};
    }
}

async function requestPlayCard(deckId, played) {
    try {
        const response = await fetch(`/api/decks/play`, 
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "PATCH",
            body: JSON.stringify({
              deckId: deckId
          })
        });
        let result = await response.json();
        return {successful: response.status == 200, msg: result.msg}; //use this
      } catch (err) {
          // Treat 500 errors here
          console.log(err);
          return {err: err};
      }
  }




async function requestCloseScore() {
    try {
        const response = await fetch(`/api/scores/auth/close`, 
        {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },            
            method: "PATCH"
        });
        return {successful: response.status == 200};
    } catch (err) {
        // Treat 500 errors here
        console.log(err);
        return {err: err};
    }
}
        
async function requestTurnResult() {
    try {
      const response = await fetch(`/api/plays/turnResult`);
      const result = await response.json();
      return { successful: response.status === 200, msg: result.msg};
    } catch (err) {
      console.log(err);
      return { err: err };
    }
  }
  
