/// <reference types="typescript" />

import type { Socket } from 'net';

export type IFData = string | number | boolean;

export const name: 'IFC2';
export const LE: true;
export const enableLog: boolean;
export const logLevel: number;
export const keepAlive: boolean;
export const doReconnect: boolean;
export const timeout: number;
export const isConnected: boolean;
export const isWaiting: boolean;
export const isPollWaiting: boolean;
export const isCallback: boolean;

export function on(event: string, listener: (...args: unknown[]) => void): void;
export function getCommand(cmd: string): Uint8Array;
export function setCommand<T extends IFData>(cmd: string, value: T): Uint8Array;
export function get<T extends IFData>(
    cmd: string,
    callback: (data: T) => void
): void;
export function set<T extends IFData>(cmd: string, value: T): void;
export function run(cmd: string): void;
export function manifestByName(): { [key: string]: ManifestNameItem };
export function manifestByCommand(): { [key: string]: ManifestCommandItem };
export function pollRegister<T extends IFData>(
    cmd: string,
    callback: (data: T) => void
): void;
export function pollDeregister(cmd: string): void;
export function init(successCallback?: () => void, params?: InitInfo): void;
export function close(callback: () => void): void;

export enum LogLevel {
    INFO = 3,
    WARN = 2,
    ERROR = 1,
    MANDATORY = 0,
}

export enum Action {
    GET = 0,
    SET = 1,
    RUN = -1,
    MANIFEST = -1,
}

export enum DataType {
    BOOLEAN = 0,
    INTEGER = 1,
    FLOAT = 2,
    DOUBLE = 3,
    STRING = 4,
    LONG = 5,
}

export interface InfiniteFlight {
    broadcastPort: 15000;
    serverPort: 10112;
    serverAddress: string;
    clientSocket: Socket;
    manifestSocket: Socket;
    pollSocket: Socket;
    manifestTimeout: number;
    manifestData: string;
    manifestByName: { [key: number]: ManifestNameItem };
    manifestByCommand: { [key: string]: ManifestCommandItem };
    manifestLength: number;
    manifestBuffer: Buffer | null;
}

export interface ManifestCommandItem {
    name: string;
    type: DataType;
}

export interface ManifestNameItem {
    command: number;
    type: DataType;
}

export interface InitInfo {
    enableLog?: boolean;
    logLevel?: LogLevel;
    keepAlive?: boolean;
    doReconnect?: boolean;
    timeout?: number;
    callback?: boolean;
    infoCallback?: (info: unknown) => void;
    pollThrottle?: number;
    host?: string;
    port?: number;
}
