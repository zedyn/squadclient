export interface IOptions {
    host: string;
    port: number;
    password: string;
    autoReconnectDelay?: number;
}

export interface IDecodedPacket {
    type: number;
    id: number;
    count: number;
    body: string;
    size: number;
}

export enum ServerData {
    EXECCOMMAND = 0x02,
    RESPONSE_VALUE = 0x00,
    AUTH = 0x03,
    AUTH_RESPONSE = 0x02,
    CHAT_VALUE = 0x01,
}

export enum Packet {
    MID_PACKET_ID = 0x01,
    END_PACKET_ID = 0x02,
}

export interface ITeams {
    teamA: string | null;
    teamB: string | null;
}

export interface IFactions {
    teamA: string | null;
    teamB: string | null;
}

export interface ILayer {
    current: string | null;
    next: string | null;
}

export interface ISquad {
    squadID: number;
    squadName: string;
    size: number;
    locked: boolean;
    creatorName: string;
    creatorEOSID: string;
    creatorSteamID: string;
    teamID: number;
    teamName: string;
}

export interface IPlayer {
    playerID: number;
    eosID: string;
    steamID: string;
    name: string;
    teamID: number;
    squadID: number;
    isLeader: boolean;
    role: string;
}

export interface IServer {
    MaxPlayers: number;
    GameMode_s: string;
    MapName_s: string;
    SEARCHKEYWORDS_s: string;
    GameVersion_s: string;
    LICENSEDSERVER_b: boolean;
    PLAYTIME_I: string;
    Flags_I: number;
    MATCHHOPPER_s: string;
    MatchTimeout_d: number;
    SESSIONTEMPLATENAME_s: string;
    Password_b: boolean;
    PlayerCount_I: string;
    NextLayer_s: string;
    ServerName_s: string;
    LicenseId_s: string;
    LicenseSig1_s: string;
    LicenseSig2_s: string;
    LicenseSig3_s: string;
    TagLanguage_s: string;
    TagPlaystyle_s: string;
    TagExperience_s: string;
    TagMapRotation_s: string;
    TagRules_s: string;
    CurrentModLoadedCount_I: string;
    AllModsWhitelisted_b: boolean;
    'ap-east-1_I': string;
    'ap-southeast-2_I': string;
    'eu-north-1_I': string;
    'me-central-1_I': string;
    'eu-central-1_I': string;
    'us-east-1_I': string;
    'eu-west-2_I': string;
    'us-west-1_I': string;
    'ap-southeast-1_I': string;
    Region_s: string;
    TeamOne_s: string;
    TeamTwo_s: string;
    PlayerReserveCount_I: string;
    PublicQueueLimit_I: string;
    PublicQueue_I: string;
    ReservedQueue_I: string;
    BeaconPort_I: string;
}
