Hooks.on("renderChatMessage", () => {});
Hooks.on("init", () => {
  game.settings.register("so-inspired", "maxInspiration", {
    name: "Maximum Inspiration",
    hint: "The maximum amount of inspiration that can be held by a player at a time.",
    scope: "World",
    config: true,
    type: Number,
    default: 1,
  });
});

Hooks.on("ready", () => {
  createInspoFlag();
});

Hooks.on("renderActorSheet", (_sheet, html) => {
  renderNewInspoSheet(_sheet, html);
});

Hooks.on("updateUser", (user) => {
  updateSheetForInspo(user);
  //updatePlayerListInspo();
});
/*
async function updatePlayerListInspo() {
  const playerList = $(document)
    .find("aside#players.app")
    .find("ol")
    .find("li");
  for (const player of $(document)
    .find("aside#players.app")
    .find("ol")
    .find("li")) {
    const user = await fromUuid(`User.${$(player).attr("data-user-id")}`);
    const inspoCount = user.getFlag("so-inspired", "inspirationCount");
    console.log(player);
    $(player).append(`<span class="inspiration-count">${inspoCount}</span>`);
  }
}
*/
function createInspoFlag() {
  for (const user of game.users) {
    if (!user.getFlag("so-inspired", "inspirationCount")) {
      user.setFlag("so-inspired", "inspirationCount", 0);
    }
  }
}

function renderNewInspoSheet(_sheet, html) {
  if (_sheet.actor.type === "character") {
    const actorUuid = _sheet.actor.uuid;
    const actorOwner = game.users.find((u) => u.character.uuid === actorUuid);
    let currentInspiration;
    if (actorOwner) {
      currentInspiration = actorOwner.getFlag(
        "so-inspired",
        "inspirationCount"
      );
    }

    const inspirationArea = $(html).find(".inspiration");
    inspirationArea.hide();

    const counterArea = $(html).find(".counters");

    const newInspirationArea = `<div class="counter flexrow new-inspiration"><h4>Inspiration</h4><div class="counter-value"><button type="button" class="add-inspiration-btn"><i class="fa-solid fa-plus" style="color: #000000;"></i></button><button type="button" class="remove-inspiration-btn"><i class="fa-solid fa-minus" style="color: #000000;"></i></button><span class="inspiration-span">${currentInspiration}</span></div></div>`;

    counterArea.append(newInspirationArea);

    $(counterArea)
      .find(".add-inspiration-btn")
      .off("click")
      .on("click", function () {
        addInspiration(actorOwner, _sheet);
      });
    $(counterArea)
      .find(".remove-inspiration-btn")
      .off("click")
      .on("click", function () {
        removeInspiration(actorOwner, _sheet);
      });
  }
}

function addInspiration(user, _sheet) {
  const maxInspo = game.settings.get("so-inspired", "maxInspiration");
  const currentInspo = user.getFlag("so-inspired", "inspirationCount");
  if (currentInspo < maxInspo) {
    user.setFlag("so-inspired", "inspirationCount", currentInspo + 1);
  }

  _sheet.render(true);
}
function removeInspiration(user, _sheet) {
  const minInspo = 0;
  const currentInspo = user.getFlag("so-inspired", "inspirationCount");
  if (currentInspo > minInspo) {
    user.setFlag("so-inspired", "inspirationCount", currentInspo - 1);
  }
  _sheet.render(true);
}

function updateSheetForInspo(user) {
  if (user?.character.sheet.rendered) {
    user.character.sheet.render(true);
  }
}
