import { io } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_MP_WS_URL || window.location.origin;

export const socket = io(wsUrl, {
  transports: ['websocket'],
  path: '/socket.io',
  autoConnect: false,
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}
