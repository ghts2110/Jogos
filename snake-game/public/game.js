export default function createGame(){
    const state = {
        players: {},
        fruits: {},
        screen: {
            width: 10,
            height: 10
        }
    }

    function start(){
        const frequency = 2000;
        
        setInterval(addFruit, frequency)
    }

    // observer
    const observers = [];

    function subscribe(observerFunction){
        observers.push(observerFunction);
    }

    function notifyAll(command){
        for (const observerFunction of observers){
            observerFunction(command);
        }
    }

    // setar estado
    function setState(newState){
        Object.assign(state, newState);
    }

    // adicionar jogador
    function addPlayer(command){
        const playerId = command.playerId;
        const playerX = 'playerX' in command ? command.playerX : Math.floor(Math.random() * state.screen.width);
        const playerY = 'playerY' in command ? command.playerY : Math.floor(Math.random() * state.screen.height);
        const playerSocre = 0;

        state.players[playerId] = {
            x: playerX,
            y: playerY,
            body: [{x: playerX, y: playerY}],
            score: playerSocre
        }

        notifyAll({
            type: 'add-player',
            playerId: playerId,
            playerX: playerX,
            playerY: playerY,
            score: playerSocre
        });
    }

    // remover jogador
    function removePlayer(command) {
        const playerId = command.playerId;

        delete state.players[playerId];

        notifyAll({
            type: 'remove-player',
            playerId: playerId,
        });
    }

    // adicionar fruta
    function isCellFree(x, y){
        for (const fruitId in state.fruits){
            const fruit = state.fruits[fruitId];
            if(fruit.x === x && fruit.y === y) return false;
        }

        for(const playerId in state.players){
            const player = state.players[playerId];
            if(Array.isArray(player.body)){
                for(const seg of player.body){
                    if(seg.x === x && seg.y === y) return false;
                }
            }else if (player.x === x && player.y === y){
                return false;
            }
        }

        return true;
    }

    function addFruit(command) {
        if(Object.keys(state.fruits).length >= 3){
            return;
        }

        const fruitId = command ? command.fruitId : Math.floor(Math.random() * 10000000);
        const fruitX = command ? command.fruitX : Math.floor(Math.random() * state.screen.width);
        const fruitY = command ? command.fruitY : Math.floor(Math.random() * state.screen.height);

        if(!isCellFree(fruitX, fruitY)) return;

        state.fruits[fruitId] = {
            x: fruitX,
            y: fruitY
        }

         notifyAll({
            type: 'add-fruit',
            fruitId: fruitId,
            fruitX: fruitX,
            fruitY: fruitY
        });
    }

    // remover fruta
    function removeFruit(command) {
        const fruitId = command.fruitId;

        delete state.fruits[fruitId];

        notifyAll({
            type: 'remove-fruit',
            fruitId: fruitId,
        });
    }

    // mover
    function movePlayer(command){
        notifyAll(command);
        
        const acceptedMoves = {
            ArrowUp({x, y}){
                y -= 1;
                if(y === -1){
                    y = state.screen.height-1;
                }

                return {x, y};
            },
            ArrowRight({x, y}){
                x += 1;
                if(x === state.screen.width){
                    x = 0;
                } 

                return {x, y};
            },
            ArrowDown({x, y}){
                y += 1;
                if(y === state.screen.height){
                    y = 0;
                } 

                return {x, y};
            },
            ArrowLeft({x, y}){
                x -= 1;
                if(x === -1){
                    x = state.screen.width-1;
                } 

                return {x, y};
            }
        }

        const keyPressed = command.keyPressed;
        const playerId = command.playerId;
        const player = state.players[command.playerId];
        const moveFunction = acceptedMoves[keyPressed];
        
        if(player && moveFunction){
            const head = player.body[0];
            const nextPosition = moveFunction({ x: head.x, y: head.y });

            player.x = nextPosition.x;
            player.y = nextPosition.y;

            const hitPlayer = hitOtherPlayerAt(nextPosition.x, nextPosition.y);
            if(!hitPlayer){
                removePlayer({playerId: playerId});
            }

            player.body.unshift(nextPosition);

            const ateFruit = checkForFruitCollisionAt(playerId);
            if (!ateFruit) {
                player.body.pop();
            }
        }
    }

    // score
    function addScore(playerId){
        const player = state.players[playerId];
        if (!player) return;

        player.score += 1;
        
        notifyAll({
            type: 'add-score',
            playerId,
            score: player.score,
        });
    }

    // check cell
    function hitOtherPlayerAt(x, y){
        for(const playerId in state.players){
            const player = state.players[playerId];

            if(Array.isArray(player.body)){
                for(const seg of player.body){
                    if(seg.x === x && seg.y === y) return false;
                }
            }else if (player.x === x && player.y === y){
                return false;
            }
        }

        return true;
    }

    function checkForFruitCollisionAt(playerId){
        const player = state.players[playerId];

        for(const fruitId in state.fruits){
            const fruit = state.fruits[fruitId];

            if(player.x === fruit.x && player.y === fruit.y){
                addScore(playerId);
                removeFruit({fruitId: fruitId});
                return true;
            }
        }

        return false;
    }

    return {
        movePlayer,
        state,
        addPlayer,
        removePlayer,
        addFruit,
        removeFruit,
        setState,
        subscribe,
        start,
        addScore
    }
}
