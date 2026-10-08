import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import {
  gameEngine,
  MultiplayerGameEngine,
} from "../engine/multiplayer-engine";
import {
  ClientJoinRoomPayload,
  ClientReconnectPayload,
  ClientSubmitAnswerPayload,
  WS_EVENTS,
} from "./events";

export function initSocketServer(
  httpServer: HTTPServer,
  engine: MultiplayerGameEngine = gameEngine
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Connect engine broadcast and direct message callbacks to Socket.IO
  engine.setEmitters(
    (roomCode: string, event: string, payload: any) => {
      io.to(roomCode.toUpperCase()).emit(event, payload);
    },
    (socketId: string, event: string, payload: any) => {
      io.to(socketId).emit(event, payload);
    }
  );

  io.on("connection", (socket: Socket) => {
    // 1. Join Room
    socket.on(WS_EVENTS.ROOM_JOIN, (payload: ClientJoinRoomPayload, callback?: Function) => {
      try {
        const { roomCode, displayName, userId } = payload;
        const upperCode = roomCode.toUpperCase().trim();

        const { player, reconnectToken } = engine.joinRoom(
          upperCode,
          socket.id,
          displayName,
          userId
        );

        socket.join(upperCode);

        const snapshot = engine.getRoomSnapshotForPlayer(upperCode, player.id);

        if (callback) {
          callback({
            success: true,
            playerId: player.id,
            reconnectToken,
            room: snapshot,
          });
        }

        socket.emit(WS_EVENTS.ROOM_STATE, snapshot);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
        socket.emit(WS_EVENTS.ERROR, { code: "JOIN_FAILED", message: err.message });
      }
    });

    // 2. Reconnect Player (Prompt Section 13)
    socket.on(
      WS_EVENTS.ROOM_RECONNECT,
      (payload: ClientReconnectPayload, callback?: Function) => {
        try {
          const { roomCode, playerId, reconnectToken } = payload;
          const upperCode = roomCode.toUpperCase().trim();

          const player = engine.reconnectPlayer(
            upperCode,
            socket.id,
            playerId,
            reconnectToken
          );

          socket.join(upperCode);

          const snapshot = engine.getRoomSnapshotForPlayer(upperCode, player.id);

          if (callback) {
            callback({
              success: true,
              player: { id: player.id, displayName: player.displayName, score: player.score },
              room: snapshot,
            });
          }

          socket.emit(WS_EVENTS.ROOM_STATE, snapshot);
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
          socket.emit(WS_EVENTS.ERROR, { code: "RECONNECT_FAILED", message: err.message });
        }
      }
    );

    // 3. Spectator Join (Prompt Section 16)
    socket.on(WS_EVENTS.SPECTATOR_JOIN, (payload: { roomCode: string }, callback?: Function) => {
      try {
        const upperCode = payload.roomCode.toUpperCase().trim();
        engine.joinSpectator(upperCode, socket.id);
        socket.join(upperCode);

        const snapshot = engine.getRoomSnapshotForPlayer(upperCode);
        if (callback) callback({ success: true, room: snapshot });
        socket.emit(WS_EVENTS.ROOM_STATE, snapshot);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. Host Start Game (Prompt Section 15)
    socket.on(WS_EVENTS.GAME_START, (payload: { roomCode: string }, callback?: Function) => {
      try {
        const upperCode = payload.roomCode.toUpperCase().trim();
        engine.startGame(upperCode, socket.id);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
        socket.emit(WS_EVENTS.ERROR, { code: "START_FAILED", message: err.message });
      }
    });

    // 5. Submit Answer (Prompt Section 6, 7 & 8)
    socket.on(
      WS_EVENTS.ANSWER_SUBMIT,
      (payload: ClientSubmitAnswerPayload, callback?: Function) => {
        try {
          const { roomCode, gameQuestionId, displayedOptionId } = payload;
          const result = engine.submitAnswer(
            roomCode,
            socket.id,
            gameQuestionId,
            displayedOptionId
          );

          if (callback) callback({ success: true, result });
        } catch (err: any) {
          if (callback) callback({ success: false, error: err.message });
          socket.emit(WS_EVENTS.ERROR, { code: "ANSWER_FAILED", message: err.message });
        }
      }
    );

    // 6. Handle Disconnect
    socket.on("disconnect", () => {
      engine.handleDisconnect(socket.id);
    });
  });

  return io;
}
