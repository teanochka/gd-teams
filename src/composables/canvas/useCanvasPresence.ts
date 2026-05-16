import { onUnmounted, ref } from "vue";
import type { ProjectId } from "@/types/domain";
import type { CanvasPoint } from "@/types/canvas";

export type CanvasPresenceUser = {
  x: number;
  y: number;
  user: string;
  color: string;
};

export type CanvasPresenceMessage =
  | {
      type: "cursor_move";
      x: number;
      y: number;
    }
  | {
      type: "canvas_patch";
      data: unknown;
    };

const getUserColor = (userId: string) => {
  let hash = 0;

  for (let index = 0; index < userId.length; index += 1) {
    hash = userId.charCodeAt(index) + ((hash << 5) - hash);
  }

  const color = (hash & 0x00ffffff).toString(16).toUpperCase();

  return `#${"00000".substring(0, 6 - color.length)}${color}`;
};

export function useCanvasPresence(projectId: ProjectId, nickname: string) {
  const cursors = ref<Record<string, CanvasPresenceUser>>({});
  let socket: WebSocket | null = null;
  let lastCursorSentAt = 0;

  const connect = () => {
    if (!projectId || !nickname || socket) {
      return;
    }

    socket = new WebSocket(`ws://127.0.0.1:8000/ws/${projectId}/${nickname}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as {
        type?: string;
        user?: string;
        data?: Partial<CanvasPresenceMessage>;
      };

      if (message.type === "disconnect" && message.user) {
        const nextCursors = { ...cursors.value };
        delete nextCursors[message.user];
        cursors.value = nextCursors;
        return;
      }

      if (
        message.user &&
        message.data?.type === "cursor_move" &&
        typeof message.data.x === "number" &&
        typeof message.data.y === "number"
      ) {
        cursors.value = {
          ...cursors.value,
          [message.user]: {
            x: message.data.x,
            y: message.data.y,
            user: message.user,
            color:
              cursors.value[message.user]?.color ?? getUserColor(message.user),
          },
        };
      }
    };
  };

  const sendMessage = (message: CanvasPresenceMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const sendCursor = (point: CanvasPoint) => {
    const now = Date.now();

    if (now - lastCursorSentAt < 30) {
      return;
    }

    sendMessage({ type: "cursor_move", x: point.x, y: point.y });
    lastCursorSentAt = now;
  };

  onUnmounted(() => {
    socket?.close();
    socket = null;
  });

  return {
    cursors,
    connect,
    sendCursor,
    sendMessage,
  };
}
