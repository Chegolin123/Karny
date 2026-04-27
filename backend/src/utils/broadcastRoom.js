const { getWebSocketServer } = require('../websocket');

function broadcastToRoom(roomId, data) {
  const wss = getWebSocketServer();
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.roomId == roomId && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

module.exports = { broadcastToRoom };
