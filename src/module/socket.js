let socket;

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("so-inspired");
  socket.register("updatePlayerList", _socketUpdatePlayerList);
});

export async function updatePlayerList() {
  return await socket.executeForOthers(_socketUpdatePlayerList);
}

async function _socketUpdatePlayerList() {
  ui.players.render();
}
