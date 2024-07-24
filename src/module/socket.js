let socket;

Hooks.once("socketlib.ready", () => {
  socket = socketlib.registerModule("so-inspired");
  socket.register("updatePlayerList", _socketUpdatePlayerList);
  socket.register("addSharedInspiration", _socketAddSharedInspiration);
  socket.register("removeSharedInspiration", _socketRemoveSharedInspiration);
});

export async function updatePlayerList() {
  return await socket.executeForOthers(_socketUpdatePlayerList);
}

export async function addSharedInspiration() {
  return await socket.executeAsGM(_socketAddSharedInspiration);
}

export async function removeSharedInspiration() {
  return await socket.executeAsGM(_socketRemoveSharedInspiration);
}

async function _socketUpdatePlayerList() {
  ui.players.render();
}

async function _socketAddSharedInspiration() {
  const currentInspiration = await game.settings.get(
    "so-inspired",
    "sharedInspiration"
  );
  await game.settings.set(
    "so-inspired",
    "sharedInspiration",
    currentInspiration + 1
  );
}

async function _socketRemoveSharedInspiration() {
  const currentInspiration = await game.settings.get(
    "so-inspired",
    "sharedInspiration"
  );
  await game.settings.set(
    "so-inspired",
    "sharedInspiration",
    currentInspiration - 1
  );
}
