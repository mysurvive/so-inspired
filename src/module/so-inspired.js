import {
  addSharedInspiration,
  removeSharedInspiration,
  updatePlayerList,
} from "./socket";

Hooks.on("init", () => {
  loadTemplates([
    "modules/so-inspired/templates/colorPicker.hbs",
    "modules/so-inspired/templates/inspirationHandler.hbs",
  ]);

  game.settings.register("so-inspired", "maxInspiration", {
    name: "Maximum Inspiration",
    hint: "The maximum amount of inspiration that can be held by a player at a time.",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
  });

  game.settings.register("so-inspired", "showInspirationOnPlayerList", {
    name: "Show Inspiration on Player List",
    hint: "Shows the amount of inspiration for each user on the player list (requires reload).",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: true,
  });

  game.settings.register("so-inspired", "inspirationBackgroundColor", {
    scope: "client",
    config: false,
    type: Object,
    default: { colorpicker1: "#401f25", colorpicker2: "#741b2b" },
  });

  game.settings.register("so-inspired", "useSharedInspiration", {
    name: "Use Shared Inspiration",
    hint: "Changes from the default per-user inspiration count to a shared pool of inspiration that any player can use.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("so-inspired", "sharedInspiration", {
    scope: "world",
    config: false,
    type: Number,
    default: 0,
  });

  game.settings.register("so-inspired", "inspirationName", {
    name: "Inspiration Name",
    hint: 'Set the global name for "Inspiration"',
    scope: "world",
    config: true,
    type: String,
    default: "Inspiration",
  });

  game.settings.registerMenu("so-inspired", "colorPickerMenu", {
    name: "Color Picker",
    label: "Open color menu",
    hint: "Changes the color of the inspiration bar on the DND5e2 character sheet.",
    type: ColorPickerSubmenu,
    restricted: false,
  });

  game.keybindings.register("so-inspired", "inspirationHandler", {
    name: "Inspiration Handler",
    hint: "Opens the Inspiration handler dialog",
    restricted: true,
    editable: [{ key: "KeyI" }],
    onDown: () => {
      if (game.user.isGM) {
        inspirationHandler();
      }
      return true;
    },
  });
});

class ColorPickerSubmenu extends FormApplication {
  constructor() {
    super();
    addEventListener("change", this.updatePicker, false);
  }

  updatePicker(event) {
    const soInspiredStyleSheet = Object.values(document.styleSheets).find((s) =>
      s.href.split("/").find((i) => i.includes("so-inspired.css"))
    );
    const color1 = document.querySelector("input#colorpicker1").value;
    const color2 = document.querySelector("input#colorpicker2").value;

    if (
      soInspiredStyleSheet.cssRules[0].selectorText ===
      ".meter.hit-dice.progress.preview::before"
    )
      soInspiredStyleSheet.deleteRule(0);

    if (event.target.id == "colorpicker1") {
      soInspiredStyleSheet.insertRule(
        `.meter.hit-dice.progress.preview::before {
          background: 
            linear-gradient(
            to right,
            ${event.target.value} 0%,
            ${color2} 100%
          ) !important;
          border-right: none !important;`,
        0
      );
    } else if (event.target.id == "colorpicker2") {
      soInspiredStyleSheet.insertRule(
        `.meter.hit-dice.progress.preview::before {
          background: 
            linear-gradient(
            to right,
            ${color1} 0%,
            ${event.target.value} 100%
          ) !important;
          border-right: none !important;`,
        0
      );
    }
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      popOut: true,
      template: "modules/so-inspired/templates/colorPicker.hbs",
      classes: ["form", "so-inspired", "color-picker"],
      id: "so-inspired-color-picker",
      title: "Inspiration Color Picker",
    });
  }

  getData() {
    return game.settings.get("so-inspired", "inspirationBackgroundColor");
  }

  _updateObject(event, formData) {
    const data = expandObject(formData);
    game.settings.set("so-inspired", "inspirationBackgroundColor", data);
    Hooks.callAll("changeInspirationColor");
  }
}

Hooks.on("ready", () => {
  createInspoFlag();

  const styles = Object.values(document.styleSheets).find((s) =>
    Object.values(s.cssRules).find(
      (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
    )
  );
  const soInspiredStyleSheet = Object.values(styles.cssRules).find(
    (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
  ).styleSheet;

  const color1 = game.settings.get(
    "so-inspired",
    "inspirationBackgroundColor"
  ).colorpicker1;
  const color2 = game.settings.get(
    "so-inspired",
    "inspirationBackgroundColor"
  ).colorpicker2;

  soInspiredStyleSheet.insertRule(
    `.meter.hit-dice.progress::before {
          background: 
            linear-gradient(
            to right,
            ${color1} 0%,
            ${color2} 100%
          ) !important;
          border-right: none !important;`,
    0
  );
});

Hooks.on("changeInspirationColor", () => {
  const styles = Object.values(document.styleSheets).find((s) =>
    Object.values(s.cssRules).find(
      (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
    )
  );
  const soInspiredStyleSheet = Object.values(styles.cssRules).find(
    (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
  ).styleSheet;

  for (const key of Object.keys(soInspiredStyleSheet.cssRules)) {
    if (
      soInspiredStyleSheet.cssRules[key]?.selectorText ===
      ".meter.hit-dice.progress.inspiration::before"
    ) {
      soInspiredStyleSheet.deleteRule(key);
    }
  }

  const color1 = game.settings.get(
    "so-inspired",
    "inspirationBackgroundColor"
  ).colorpicker1;
  const color2 = game.settings.get(
    "so-inspired",
    "inspirationBackgroundColor"
  ).colorpicker2;

  soInspiredStyleSheet.insertRule(
    `.meter.hit-dice.progress.inspiration::before {
          background: 
            linear-gradient(
            to right,
            ${color1} 0%,
            ${color2} 100%
          ) !important;
          border-right: none !important;`,
    1
  );
});

Hooks.on("renderActorSheetV2", (_sheet, html) => {
  renderNewInspoSheet(_sheet, html);
});

Hooks.on("updateUser", (user) => {
  updateSheetForInspo(user);
});

Hooks.on("renderPlayers", () => {
  if (game.settings.get("so-inspired", "showInspirationOnPlayerList"))
    updatePlayerListInspo();
});

Hooks.on("tidy5e-sheet.renderActorSheet", (app, element) => {
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
    currentInspiration = game.settings.get(
      "so-inspired",
      "useSharedInspiration"
    )
      ? game.settings.get("so-inspired", "sharedInspiration")
      : actorOwner.getFlag("so-inspired", "inspirationCount");

    let newInspirationArea = `
      <div
        data-tidy-render-scheme="handlebars"
        class="counter flexrow new-inspiration"
        style="width: 200px; height: 25px; display: flex; margin: 10px 10px 10px 10px"
      >
        <h4>${game.settings.get("so-inspired", "inspirationName")}</h4>
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

async function updatePlayerListInspo() {
  const playerList = $(document).find("aside#players").find("ol").find("li");
  for (const player of playerList) {
    const user = await fromUuid(`User.${$(player).attr("data-user-id")}`);
    if (!user.isGM) {
      const inspoCount = game.settings.get(
        "so-inspired",
        "useSharedInspiration"
      )
        ? game.settings.get("so-inspired", "sharedInspiration")
        : user.getFlag("so-inspired", "inspirationCount");
      $(player)
        .children()
        .last()
        .append(`<span class="inspiration-count"> - ${inspoCount}</span>`);
    }
  }
}

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
    if (actorOwner) {
      let currentInspiration;
      let maxInspiration;
      currentInspiration = game.settings.get(
        "so-inspired",
        "useSharedInspiration"
      )
        ? game.settings.get("so-inspired", "sharedInspiration")
        : actorOwner.getFlag("so-inspired", "inspirationCount");
      maxInspiration = game.settings.get("so-inspired", "maxInspiration");

      const inspirationArea = $(html).find(".inspiration");
      inspirationArea.hide();

      let counterArea;
      let newInspirationArea;

      if (_sheet.options.classes.includes("dnd5e2")) {
        counterArea = $(html).find(".card .stats").children().last();
        newInspirationArea = `<div class="meter-group"><div class="label roboto-condensed-upper"><span>${game.settings.get(
          "so-inspired",
          "inspirationName"
        )}</span></div><div class="meter hit-dice progress inspiration" role="meter" aria-valuemin="0" aria-valuenow="${currentInspiration}" aria-valuemax="${maxInspiration}" style="--bar-percentage: ${
          (currentInspiration / maxInspiration) * 100
        }%"><div class="label"><span class="value">${currentInspiration}</span><span class="separator"> / </span><span class="max">${maxInspiration}</span></div><div class="inspo-buttons"><button type="button" class="add-inspiration-btn"><i class="fa-solid fa-plus" style="color: #000000;"></i></button><button type="button" class="remove-inspiration-btn"><i class="fa-solid fa-minus" style="color: #000000;"></i></button></div></div></div>`;
        counterArea.after(newInspirationArea);
      } else {
        counterArea = $(html).find(".counters");
        newInspirationArea = `<div class="counter flexrow new-inspiration"><h4>${game.settings.get(
          "so-inspired",
          "inspirationName"
        )}</h4><div class="counter-value"><button type="button" class="add-inspiration-btn"><i class="fa-solid fa-plus" style="color: #000000;"></i></button><button type="button" class="remove-inspiration-btn"><i class="fa-solid fa-minus" style="color: #000000;"></i></button><span class="inspiration-span">${currentInspiration}</span></div></div>`;
        counterArea.append(newInspirationArea);
      }

      $(html)
        .find(".add-inspiration-btn")
        .off("click")
        .on("click", async function () {
          await addInspiration(actorOwner, _sheet);
          ui.players.render();
        });
      $(html)
        .find(".remove-inspiration-btn")
        .off("click")
        .on("click", async function () {
          await removeInspiration(actorOwner, _sheet);
          ui.players.render();
        });
    }
  }
}

async function addInspiration(user, _sheet) {
  if (!user) {
    ui.notifications.error("Sheet has no owner assigned.");
    return;
  }
  const maxInspo = game.settings.get("so-inspired", "maxInspiration");
  const currentInspo = game.settings.get("so-inspired", "useSharedInspiration")
    ? game.settings.get("so-inspired", "sharedInspiration")
    : user.getFlag("so-inspired", "inspirationCount");

  if (currentInspo < maxInspo) {
    game.settings.get("so-inspired", "useSharedInspiration")
      ? await addSharedInspiration()
      : await user.setFlag("so-inspired", "inspirationCount", currentInspo + 1);
    ChatMessage.create({
      user: user,
      flavor:
        (game.settings.get("so-inspired", "useSharedInspiration")
          ? "The group "
          : _sheet
          ? _sheet.actor.name
          : user.name) +
        ` has gained ${game.settings.get("so-inspired", "inspirationName")}!`,
    });
  } else {
    ChatMessage.create({
      user: user,
      flavor:
        (game.settings.get("so-inspired", "useSharedInspiration")
          ? "The group "
          : _sheet
          ? _sheet.actor.name
          : user.name) +
        ` was granted ${game.settings.get(
          "so-inspired",
          "inspirationName"
        )}, but can't have any more. Don't forget to use your ${game.settings.get(
          "so-inspired",
          "inspirationName"
        )}!`,
    });
  }
  if (_sheet) _sheet.render(true);
  updatePlayerList();
}

async function removeInspiration(user, _sheet) {
  if (!user) {
    ui.notifications.error("Sheet has no owner assigned.");
    return;
  }
  const minInspo = 0;
  const currentInspo = game.settings.get("so-inspired", "useSharedInspiration")
    ? game.settings.get("so-inspired", "sharedInspiration")
    : user.getFlag("so-inspired", "inspirationCount");
  if (currentInspo > minInspo) {
    game.settings.get("so-inspired", "useSharedInspiration")
      ? await removeSharedInspiration()
      : await user.setFlag("so-inspired", "inspirationCount", currentInspo - 1);
    ChatMessage.create({
      user: user,
      flavor:
        (game.settings.get("so-inspired", "useSharedInspiration")
          ? "The group "
          : _sheet.actor.name) +
        ` has used ${game.settings.get("so-inspired", "inspirationName")}!`,
    });
  }
  _sheet.render(true);
  updatePlayerList();
}

function updateSheetForInspo(user) {
  if (user?.character.sheet.rendered) {
    user.character.sheet.render(false);
  }
}

async function inspirationHandler() {
  const options = {
    users: game.users
      .map((u) => {
        if (!u.isGM) return { name: u.name, id: u.id };
      })
      .filter((u) => u != undefined),
    inspirationLabel: game.settings.get("so-inspired", "inspirationName"),
  };

  new Dialog({
    title: "Inspiration Handler",
    content: await renderTemplate(
      "modules/so-inspired/templates/inspirationHandler.hbs",
      options
    ),
    buttons: {
      confirm: {
        label: "Confirm",
        callback: (html) => {
          inspirationHandlerResponse(html);
        },
      },
      cancel: {
        label: "Cancel",
        callback: () => {},
      },
    },
  }).render(true);
}

function inspirationHandlerResponse(html) {
  const userId = html.find('input[name="user"]:checked').attr("id");
  if (userId === "all") {
    for (const user of game.users) {
      if (!user.isGM) {
        addInspiration(user);
      }
    }
  } else {
    const user = game.users.get(userId);
    addInspiration(user);
  }
}
