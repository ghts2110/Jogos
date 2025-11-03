import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function decideMove({ players, fruits, myId }) {
    const sys =
`Você é um agente que joga Snake por teclas. Regras:
- Retorne somente uma das teclas permitidas (ArrowUp/ArrowDown/ArrowLeft/ArrowRight).
- Evite colisão com seu corpo e com outras cobras.
- Preferir mover em direção à fruta mais próxima se seguro.
- Evite reversão 180° se seu corpo tiver tamanho > 1.
- O mapa dá wrap nas bordas (0..width-1, 0..height-1).
    `;

    let text = `Sua Posição: {x: ${myId.x}, y: ${myId.y}}\n`;
    text += "Jogadores: ";
    for(const playerId in players){
        const player = players[playerId];
        for(const body of player.body){
            text += `{x: ${body.x}, y: ${body.y}}`;
        }
    }
    text += "\nFrutas: "
    for(const fruitId in fruits){
        const fruit = fruits[fruitId];
        text += `{x: ${fruit.x}, y: ${fruit.y}}`;
    }

    console.log(text);

    const rsp = await client.responses.create({
        model: "gpt-4o",
        text: {
            format: {
                type: "json_schema",
                name: "snake_move",        
                schema: {
                    type: "object",
                    properties: {
                    move: { type: "string", enum: ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"] }
                    },
                    required: ["move"],
                    additionalProperties: false
                }
            }
        },
        input: [
            { role: "system", content: sys },
            { role: "user", content: text }
        ]
    });

    const { move } = JSON.parse(rsp.output[0].content[0].text);

    return move;
}
