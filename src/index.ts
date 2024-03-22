import { ILayer, IOptions, IPlayer, ISquad, ITeams, ServerInfo } from './types';

import Rcon from './structures/Rcon';

export class SquadClient extends Rcon {
    constructor(options: IOptions) {
        super(options);
    }

    public async getTeams(): Promise<ITeams> {
        const response: string[] = (await super.execute('ListSquads')).split('\n');

        const indexOfTeamA: number = response.findIndex(
            (line: string) => line.includes('Team ID: 1') && line.endsWith(')')
        );

        const indexOfTeamB: number = response.findIndex(
            (line: string) => line.includes('Team ID: 2') && line.endsWith(')')
        );

        const object: ITeams = {
            teamA: '',
            teamB: '',
        };

        if (indexOfTeamA != -1) {
            object.teamA = response[indexOfTeamA].split('(')[1].slice(0, -1);
        } else {
            object.teamA = null;
        }

        if (indexOfTeamB != -1) {
            object.teamB = response[indexOfTeamB].split('(')[1].slice(0, -1);
        } else {
            object.teamB = null;
        }

        await super.disconnect();

        return object;
    }

    public async getServerInfo(): Promise<ServerInfo> {
        const serverInfo: string = await super.execute('ShowServerInfo');

        await super.disconnect();

        return JSON.parse(serverInfo);
    }

    public async getLayers(): Promise<ILayer> {
        const response: string = await super.execute('ShowCurrentMap');

        const match: RegExpMatchArray | null = response.match(/^Current level is (.*), layer is (.*)/);

        const serverInfo: ServerInfo = await this.getServerInfo();

        await super.disconnect();

        return {
            current: match ? match[2] : null,
            next: serverInfo.NextLayer_s ?? null,
        };
    }

    public async getSquads(): Promise<ISquad[]> {
        const responseSquad = await super.execute('ListSquads');

        const squads: ISquad[] = [];
        let teamName;
        let teamID;
        let lock;

        if (!responseSquad || responseSquad.length < 1) return squads;

        for (const line of responseSquad.split('\n')) {
            const match = line.match(
                /ID: (?<squadID>\d+) \| Name: (?<squadName>.+) \| Size: (?<size>\d+) \| Locked: (?<locked>True|False) \| Creator Name: (?<creatorName>.+) \| Creator Online IDs: EOS: (?<creatorEOSID>[a-f\d]{32})(?: steam: (?<creatorSteamID>\d{17}))?/
            );
            const matchSide = line.match(/Team ID: (\d) \((.+)\)/);
            const locked = line.match(/Locked: (?<locked>True|False)/);

            if (matchSide) {
                teamID = +matchSide[1];
                teamName = matchSide[2];
            }

            if (locked) {
                if (locked[1] == 'True') {
                    lock = true;
                } else {
                    lock = false;
                }
            }

            if (!match) continue;

            const group = match.groups as any;

            group.squadID = +group.squadID;
            group.size = parseInt(group.size, 10);
            squads.push({
                ...group,
                locked: lock,
                teamID: teamID,
                teamName: teamName,
            });
        }

        await super.disconnect();

        return squads;
    }

    public async getPlayers(): Promise<IPlayer[]> {
        const response: string = await super.execute('ListPlayers');

        const players: IPlayer[] = [];

        if (!response || response.length < 1) return players;

        for (const line of response.split('\n')) {
            const match = line.match(
                /^ID: (?<playerID>\d+) \| Online IDs: EOS: (?<eosID>[a-f\d]{32}) (?:steam: (?<steamID>\d{17}) )?\| Name: ?(?<name>.+) \| Team ID: (?<teamID>\d|N\/A) \| Squad ID: (?<squadID>\d+|N\/A) \| Is Leader: (?<isLeader>True|False) \| Role: (?<role>.+)$/
            );

            if (!match) continue;

            const data = match.groups as any;

            data.name = data.name.trim();
            data.playerID = +data.playerID;
            data.isLeader = data.isLeader === 'True';
            data.teamID = data.teamID !== 'N/A' ? +data.teamID : null;
            data.squadID = data.squadID !== 'N/A' ? +data.squadID : null;

            players.push({
                ...data,
            });
        }

        await super.disconnect();

        return players;
    }
}
