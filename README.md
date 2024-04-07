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

## Usage / Examples

```javascript
import { SquadClient } from 'squadclient';
// For CommonJS -> const { SquadClient } = require('squadclient');

const client = new SquadClient({ host: 'serverIp', port: rconPort, password: 'rconPassword' });

(async () => {
    await client.connect();

    const info = await client.getServerInfo();

    console.log(info);
})();
```

## License

This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License.

## Authors

zédyN ([Github](https://www.github.com/zedyn) - [Discord](https://discord.com/users/1096540990162088058))

## Support

For support, DM me on [Discord](https://discord.com/users/1096540990162088058) or create a ticket in [discord.gg/luppux](https://discord.gg/luppux)
