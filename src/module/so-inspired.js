Hooks.on("renderChatMessage", () => {});
Hooks.on("init", () => {
  game.settings.register("so-inspired", "maxInspiration", {
    name: "Maximum Inspiration",
    hint: "The maximum amount of inspiration that can be held by a player at a time.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
  });
});

Hooks.on("ready", () => {
  createInspoFlag();
});

Hooks.on("renderActorSheet", (_sheet, html) => {
  console.log(_sheet.options.classes);
  renderNewInspoSheet(_sheet, html);
});

Hooks.on("updateUser", (user) => {
  updateSheetForInspo(user);
  //updatePlayerListInspo();
});

Hooks.on("tidy5e-sheet.renderActorSheet", (app, element, data) => {
  if (app.actor.type !== "character") {
    return;
  }

  const html = $(element);

  const inspirationArea = html.find(".inspiration");
  inspirationArea.hide();

  let currentInspiration;
  const actorOwner = game.users.find(
    (u) => u.character?.uuid === app.actor.uuid
  );
  if (actorOwner) {
    currentInspiration = actorOwner.getFlag("so-inspired", "inspirationCount");

    let newInspirationArea = `
      <div
        data-tidy-render-scheme="handlebars"
        class="counter flexrow new-inspiration"
        style="width: 200px; height: 25px; display: flex; margin: 10px 10px 10px 10px"
      >
        <h4>Inspiration</h4>
        <div class="counter-value">
          <button
            type="button"
            class="add-inspiration-btn"
            style="height: 20px; width: 20px; line-height: 0px; padding-left: 2px"
          >
            <i
              class="fa-solid fa-plus"
              style="color: var(--t5e-primary-font-color)"
            ></i>
          </button>
          <button
            type="button"
            class="remove-inspiration-btn"
            style="height: 20px; width: 20px; line-height: 0px; padding-left: 2px"
          >
            <i
              class="fa-solid fa-minus"
              style="color: var(--t5e-primary-font-color)"
            ></i>
          </button>
          <span class="inspiration-span" style="margin-left: 10px">
            ${currentInspiration}
          </span>
        </div>
      </div>`;
      
    html.find(".tidy5e-sheet-header").after(newInspirationArea);

    html
      .find(".add-inspiration-btn")
      .off("click")
      .on("click", function () {
        addInspiration(actorOwner, app);
      });
    html
      .find(".remove-inspiration-btn")
      .off("click")
      .on("click", function () {
        removeInspiration(actorOwner, app);
      });
  }
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
    const actorOwner = game.users.find((u) => u.character?.uuid === actorUuid);
    let currentInspiration;
    let maxInspiration;
    if (actorOwner) {
      currentInspiration = actorOwner.getFlag(
        "so-inspired",
        "inspirationCount"
      );
      maxInspiration = game.settings.get("so-inspired", "maxInspiration");
    }

    const inspirationArea = $(html).find(".inspiration");
    inspirationArea.hide();

    let counterArea;
    let newInspirationArea;
    console.log(maxInspiration);
    if (_sheet.options.classes.includes("dnd5e2")) {
      counterArea = $(html).find(".card .stats").children().last();
      newInspirationArea = `<div class="meter-group"><div class="label roboto-condensed-upper"><span>Inspiration</span></div><div class="meter hit-dice progress" role="meter" aria-valuemin="0" aria-valuenow="${currentInspiration}" aria-valuemax="${maxInspiration}" style="--bar-percentage: ${
        (currentInspiration / maxInspiration) * 100
      }%"><div class="label"><span class="value">${currentInspiration}</span><span class="separator"> / </span><span class="max">${maxInspiration}</span></div><div class="inspo-buttons"><button type="button" class="add-inspiration-btn"><i class="fa-solid fa-plus" style="color: #000000;"></i></button><button type="button" class="remove-inspiration-btn"><i class="fa-solid fa-minus" style="color: #000000;"></i></button></div></div></div>`;
      counterArea.after(newInspirationArea);
    } else {
      counterArea = $(html).find(".counters");
      newInspirationArea = `<div class="counter flexrow new-inspiration"><h4>Inspiration</h4><div class="counter-value"><button type="button" class="add-inspiration-btn"><i class="fa-solid fa-plus" style="color: #000000;"></i></button><button type="button" class="remove-inspiration-btn"><i class="fa-solid fa-minus" style="color: #000000;"></i></button><span class="inspiration-span">${currentInspiration}</span></div></div>`;
      counterArea.append(newInspirationArea);
    }

    $(html)
      .find(".add-inspiration-btn")
      .off("click")
      .on("click", function () {
        addInspiration(actorOwner, _sheet);
      });
    $(html)
      .find(".remove-inspiration-btn")
      .off("click")
      .on("click", function () {
        removeInspiration(actorOwner, _sheet);
      });
  }
}

function addInspiration(user, _sheet) {
  if (!user) {
    ui.notifications.error("Sheet has no owner assigned.");
    return;
  }
  const maxInspo = game.settings.get("so-inspired", "maxInspiration");
  const currentInspo = user.getFlag("so-inspired", "inspirationCount");

  if (currentInspo < maxInspo) {
    user.setFlag("so-inspired", "inspirationCount", currentInspo + 1);
    ChatMessage.create({
      user: user,
      flavor: _sheet.actor.name + " has gained a point of inspiration!",
    });
  } else {
    ChatMessage.create({
      user: user,
      flavor:
        _sheet.actor.name +
        " was granted inspiration, but can't have any more. Don't forget to use your inspiration!",
    });
  }
  _sheet.render(true);
}

function removeInspiration(user, _sheet) {
  const minInspo = 0;
  const currentInspo = user.getFlag("so-inspired", "inspirationCount");
  if (currentInspo > minInspo) {
    user.setFlag("so-inspired", "inspirationCount", currentInspo - 1);
    ChatMessage.create({
      user: user,
      flavor: _sheet.actor.name + " has used a point of inspiration!",
    });
  }
  _sheet.render(true);
}

function updateSheetForInspo(user) {
  if (user?.character.sheet.rendered) {
    user.character.sheet.render(false);
  }
}
