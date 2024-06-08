import { IDecodedPacket, IOptions, Packet, ServerData } from '../types';

import EventEmitter from 'events';
import { Socket } from 'net';

export default class Rcon extends EventEmitter {
    private host: string;
    private port: number;
    private password: string;
    private autoReconnectDelay: number;

    private client: Socket;

    private maximumPacketSize: number;

    private connected: boolean;
    private autoReconnect: boolean;
    private autoReconnectTimeout: any;

    private incomingData: Buffer;
    private incomingResponse: any[];
    private responseCallbackQueue: any[];

    private callbackIds: any[];
    private count: number;
    private loggedin: boolean;

    constructor(options: IOptions) {
        super();

        this.host = options.host;
        this.port = options.port;
        this.password = options.password;
        this.autoReconnectDelay = options.autoReconnectDelay || 5000;

        this.connect = this.connect.bind(this);
        this.onPacket = this.onPacket.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
        this.decodeData = this.decodeData.bind(this);
        this.encodePacket = this.encodePacket.bind(this);

        this.client = new Socket();
        this.client.on('data', this.decodeData);
        this.client.on('close', this.onClose);
        this.client.on('error', this.onError);

        this.maximumPacketSize = 4096;

        this.connected = false;
        this.autoReconnect = false;
        this.autoReconnectTimeout = null;

        this.incomingData = Buffer.from([]);
        this.incomingResponse = [];
        this.responseCallbackQueue = [];

        this.callbackIds = [];
        this.count = 1;
        this.loggedin = false;
    }

    public async execute(command: string): Promise<string> {
        return this.write(ServerData.EXECCOMMAND, command);
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const onConnect = async () => {
                this.client.removeListener('error', onError);
                this.connected = true;

                try {
                    await this.write(ServerData.AUTH, this.password);

                    this.autoReconnect = true;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            const onError = (err: Error) => {
                this.client.removeListener('connect', onConnect);

                console.log(`Squad Client | Failed to connect to: ${this.host}:${this.port}`, err);

                reject(err);
            };

            this.client.once('connect', onConnect);
            this.client.once('error', onError);

            if (this.host && this.port && !this.connected) {
                this.client.connect({ host: this.host, port: this.port });
            } else {
                console.log('Squad Client | Failed to connect! Host or port undefined.');
                reject('Failed to connect! Host or port undefined.');
            }
        });
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const onClose = () => {
                this.client.removeListener('error', onError);

                resolve();
            };

            const onError = (err: Error) => {
                this.client.removeListener('close', onClose);

                console.log(`Squad Client | Failed to disconnect from: ${this.host}:${this.port}`, err);

                reject(err);
            };

            this.client.once('close', onClose);
            this.client.once('error', onError);

            this.autoReconnect = false;
            this.connected = false;

            clearTimeout(this.autoReconnectTimeout);

            this.client.end();
        });
    }

    public isConnected(): boolean {
        return this.connected;
    }

    private processChatPacket(decodedPacket: IDecodedPacket) {
        const onSquadCreate = decodedPacket.body.match(
            /(?<playerName>.+) \(Online IDs: EOS: (?<playerEOSID>[\da-f]{32})(?: steam: (?<playerSteamID>\d{17}))?\) has created Squad (?<squadID>\d+) \(Squad Name: (?<squadName>.+)\) on (?<teamName>.+)/
        );

        const onMessage = decodedPacket.body.match(
            /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+?) : (.*)/
        );

        const onKick = decodedPacket.body.match(/Kicked player ([0-9]+)\. \[Online IDs= EOS: ([0-9a-f]{32}) steam: (\d{17})] (.*)/);

        const onBan = decodedPacket.body.match(/Banned player ([0-9]+)\. \[steamid=(.*?)\] (.*) for interval (.*)/);

        const onWarn = decodedPacket.body.match(/Remote admin has warned player (.*)\. Message was "(.*)"/);

        const onPossessedAdminCam = decodedPacket.body.match(
            /\[Online Ids:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has possessed admin camera\./
        );

        const onUnpossessedAdminCam = decodedPacket.body.match(
            /\[Online IDs:EOS: ([0-9a-f]{32}) steam: (\d{17})\] (.+) has unpossessed admin camera\./
        );

        if (onSquadCreate) {
            this.emit('squadCreate', {
                time: new Date(),
                ...onSquadCreate.groups,
            });

            return;
        }

        if (onMessage) {
            this.emit('chatMessage', {
                raw: decodedPacket.body,
                chat: onMessage[1],
                eosID: onMessage[2],
                steamID: onMessage[3],
                name: onMessage[4].trim(),
                message: onMessage[5],
                time: new Date(),
            });

            return;
        }

        if (onKick) {
            this.emit('playerKicked', {
                raw: decodedPacket.body,
                playerID: onKick[1],
                steamID: onKick[3],
                name: onKick[4],
                time: new Date(),
            });

            return;
        }

        if (onBan) {
            this.emit('playerBanned', {
                raw: decodedPacket.body,
                playerID: onBan[1],
                steamID: onBan[2],
                name: onBan[3],
                interval: onBan[4],
                time: new Date(),
            });
        }

        if (onWarn) {
            this.emit('playerWarned', {
                raw: decodedPacket.body,
                name: onWarn[1],
                reason: onWarn[2],
                time: new Date(),
            });

            return;
        }

        if (onPossessedAdminCam) {
            this.emit('possessedAdminCam', {
                raw: decodedPacket.body,
                steamID: onPossessedAdminCam[2],
                name: onPossessedAdminCam[3],
                time: new Date(),
            });

            return;
        }

        if (onUnpossessedAdminCam) {
            this.emit('unPossessedAdminCam', {
                raw: decodedPacket.body,
                steamID: onUnpossessedAdminCam[2],
                name: onUnpossessedAdminCam[3],
                time: new Date(),
            });

            return;
        }
    }

    private onPacket(decodedPacket: IDecodedPacket) {
        switch (decodedPacket.type) {
            case ServerData.RESPONSE_VALUE:
            case ServerData.AUTH_RESPONSE:
                switch (decodedPacket.id) {
                    case Packet.MID_PACKET_ID:
                        this.incomingResponse.push(decodedPacket);

                        break;
                    case Packet.END_PACKET_ID:
                        this.callbackIds = this.callbackIds.filter((p) => p.id !== decodedPacket.count);

                        this.responseCallbackQueue.shift()(this.incomingResponse.map((packet) => packet.body).join());
                        this.incomingResponse = [];

                        break;
                    default:
                        this.onClose('Unknown Packet');
                }

                break;
            case ServerData.CHAT_VALUE:
                this.processChatPacket(decodedPacket);
                break;
            default:
                this.onClose('Unknown Packet');
        }
    }

    private async onClose(hadError: string) {
        this.connected = false;
        this.loggedin = false;

        await this.disconnect();

        if (hadError) {
            console.log(`Squad Client | ${hadError}`);
        }

        if (this.incomingData.length > 0) {
            this.incomingData = Buffer.from([]);
        }

        if (this.incomingResponse.length > 0) {
            this.incomingResponse = [];
        }

        if (this.responseCallbackQueue.length > 0) {
            while (this.responseCallbackQueue.length > 0) {
                this.responseCallbackQueue.shift()(new Error('RCON DISCONNECTED'));
            }

            this.callbackIds = [];
        }

        if (this.autoReconnect) {
            setTimeout(this.connect, this.autoReconnectDelay);
        }
    }

    private onError(err: Error) {
        console.log(`Squad Client | Socket had error:`, err);
        this.emit('RCON_ERROR', err);
    }

    private decodeData(data: Buffer) {
        this.incomingData = Buffer.concat([this.incomingData, data]);

        while (this.incomingData.byteLength >= 4) {
            const size = this.incomingData.readInt32LE(0);
            const packetSize = size + 4;

            if (this.incomingData.byteLength < packetSize) {
                break;
            }

            const packet = this.incomingData.slice(0, packetSize);

            const decodedPacket = this.decodePacket(packet);

            const matchCount = this.callbackIds.filter((d) => d.id === decodedPacket.count);

            if (matchCount.length > 0 || [ServerData.AUTH_RESPONSE, ServerData.CHAT_VALUE].includes(decodedPacket.type)) {
                this.onPacket(decodedPacket);
                this.incomingData = this.incomingData.slice(packetSize);
                continue;
            }

            const probePacketSize = 21;

            if (size === 10 && this.incomingData.byteLength >= 21) {
                const probeBuf = this.incomingData.slice(0, probePacketSize);
                const decodedProbePacket = this.decodePacket(probeBuf);

                if (decodedProbePacket.body === '\x00\x00\x00\x01\x00\x00\x00') {
                    this.incomingData = this.incomingData.slice(probePacketSize);
                    continue;
                }
            }

            break;
        }
    }

    private decodePacket(packet: Buffer) {
        return {
            size: packet.readUInt32LE(0),
            id: packet.readUInt8(4),
            count: packet.readUInt16LE(6),
            type: packet.readUInt32LE(8),
            body: packet.toString('utf8', 12, packet.byteLength - 2),
        };
    }

    private encodePacket(type: number, id: number, body: string, encoding: BufferEncoding = 'utf8'): Buffer {
        const size = Buffer.byteLength(body) + 14;
        const buf = Buffer.alloc(size);

        buf.writeUInt32LE(size - 4, 0);
        buf.writeUInt8(id, 4);
        buf.writeUInt8(0, 5);
        buf.writeUInt16LE(this.count, 6);
        buf.writeUInt32LE(type, 8);
        buf.write(body, 12, size - 2, encoding);
        buf.writeUInt16LE(0, size - 2);

        return buf;
    }

    private write(type: number, body: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected.'));
                return;
            }

            if (!this.client.writable) {
                reject(new Error('Unable to write to socket.'));
                return;
            }

            if (!this.loggedin && type !== ServerData.AUTH) {
                reject(new Error('RCON not Logged in'));
                return;
            }

            const encodedPacket = this.encodePacket(type, type !== ServerData.AUTH ? Packet.MID_PACKET_ID : Packet.END_PACKET_ID, body);

            const encodedEmptyPacket = this.encodePacket(type, Packet.END_PACKET_ID, '');

            if (this.maximumPacketSize < encodedPacket.length) {
                reject(new Error('Packet too long.'));
                return;
            }

            const onError = (err: Error) => {
                console.log('Squad Client | Error occurred. Wiping response action queue.', err);
                this.responseCallbackQueue = [];
                reject(err);
            };

            if (type === ServerData.AUTH) {
                this.callbackIds.push({ id: this.count, cmd: body });

                this.responseCallbackQueue.push(() => {});
                this.responseCallbackQueue.push((decodedPacket: IDecodedPacket) => {
                    this.client.removeListener('error', onError);

                    if (decodedPacket.id === -1) {
                        console.log('Squad Client | Authentication failed.');
                        reject(new Error('Authentication failed.'));
                    } else {
                        this.loggedin = true;
                        resolve(true);
                    }
                });
            } else {
                this.callbackIds.push({ id: this.count, cmd: body });

                this.responseCallbackQueue.push((response: any) => {
                    this.client.removeListener('error', onError);

                    if (response instanceof Error) {
                        reject(response);
                    } else {
                        resolve(response);
                    }
                });
            }

            this.client.once('error', onError);

            if (this.count + 1 > 65535) {
                this.count = 1;
            }

            this.client.write(encodedPacket);

            if (type !== ServerData.AUTH) {
                this.client.write(encodedEmptyPacket);
                this.count++;
            }
        });
    }
}
