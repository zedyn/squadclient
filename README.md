![Squad](https://assets-global.website-files.com/651dd1cea3817995c17fa3c1/65e0edc1ea8c1cc2607b4ddd_squadlogo_black_hires.png)

# Squad Client

The module enables you to easily perform certain actions by connecting to the game console through your Squad game server using RCON.

## Installation

```bash
  npm install squadclient
```

```bash
  yarn add squadclient
```

```bash
  pnpm add squadclient
```

## Features

-   Custom-designed RCON infrastructure.
-   Obtaining player, team, server, and squad information quickly and easily.
-   Using promises for asynchronous operations.

## Methods

-   **getTeams()** - Get team names.
-   **getServerInfo()** - Get some info about server.
-   **getLayers()** - Get current and next layers.
-   **getSquads()** - Get squads and details.
-   **getPlayers()** - Get players.

## Events

-   **squadCreate** - Emitted whenever a squad is created.

```javascript
{
    time: Date,
    playerName: string,
    playerEOSID: string,
    playerSteamID: string,
    squadID: string,
    squadName: string,
    teamName: string
}
```

-   **chatMessage** - Emitted whenever a message is created.

```javascript
{
    raw: string,
    chat: 'ChatAll' | 'ChatTeam' | 'ChatSquad',
    eosID: string,
    steamID: string,
    name: string,
    message: string,
    time: Date
}
```

-   **playerKicked** - Emitted whenever a player kicked from server.

```javascript
{
    raw: string,
    playerID: string,
    steamID: string,
    name: string,
    time: Date
}
```

-   **playerBanned** - Emitted whenever a player banned from server.

```javascript
{
    raw: string,
    playerID: string,
    steamID: string,
    name: string,
    interval: string,
    time: Date
}
```

-   **playerWarned** - Emitted whenever a player warned.

```javascript
{
    raw: string,
    name: string,
    reason: string,
    time: Date
}
```

## Usage / Examples

```javascript
import { SquadClient } from 'squadclient';
// For CommonJS -> const { SquadClient } = require('squadclient');

const client = new SquadClient({ host: 'serverIp', port: rconPort, password: 'rconPassword' });

(async () => {
    await client.connect();

    const info = await client.getServerInfo();

    console.log(info);

    client.on('squadCreate', (squad) => {
        console.log('A squad has been created!', `Squad Name: ${squad.squadName} | Team Name: ${squad.teamName}`);
    });
})();
```

## License

This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License.

## Authors

zédyN ([Github](https://www.github.com/zedyn) - [Discord](https://discord.com/users/1096540990162088058))

## Support

For support, DM me on [Discord](https://discord.com/users/1096540990162088058) or create a ticket in [discord.gg/luppux](https://discord.gg/luppux)
