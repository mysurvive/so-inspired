import {
  addSharedInspiration,
  removeSharedInspiration,
  updatePlayerList,
} from "./socket";

import { SIMessageHandler } from "./messageHandler";
import { MESSAGE_CONSTANTS } from "./messageConstants";

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

  game.settings.register("so-inspired", "oneReroll", {
    name: "Only One Reroll",
    hint: "If enabled, only allows one reroll on a check.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("so-inspired", "addInspirationMessage", {
    name: "Add Inspiration Message",
    hint: `Add a custom message when inspiration is added. Use the key $$NAME$$ for "The party," the character's name, or the player's name in that order and $$INSPIRATION_NAME$$ for the name of the inspiration resource. Example: "$$NAME$$ has gained $$INSPIRATION_NAME$$!"`,
    scope: "world",
    config: true,
    type: String,
    default: MESSAGE_CONSTANTS.ADD_INSPIRATION,
  });

  game.settings.register("so-inspired", "maxInspirationMessage", {
    name: "Maximum Inspiration Message",
    hint: `Add a custom message when inspiration is maxed and another is attempted to be added. Use the key $$NAME$$ for "The party," the character's name, or the player's name in that order and $$INSPIRATION_NAME$$ for the name of the inspiration resource. Example: "$$NAME$$ was granted $$INSPIRATION_NAME$$, but can't have any more. Don't forget to use your $$INSPIRATION_NAME$$!"`,
    scope: "world",
    config: true,
    type: String,
    default: MESSAGE_CONSTANTS.MAX_INSPIRATION,
  });

  game.settings.register("so-inspired", "removeInspirationMessage", {
    name: "Remove Inspiration Message",
    hint: `Add a custom message when inspiration is removed. Use the key $$NAME$$ for "The party," the character's name, or the player's name in that order and $$INSPIRATION_NAME$$ for the name of the inspiration resource. Example: "$$NAME$$ has used $$INSPIRATION_NAME$$!"`,
    scope: "world",
    config: true,
    type: String,
    default: MESSAGE_CONSTANTS.REMOVE_INSPIRATION,
  });

  game.settings.register("so-inspired", "noInspirationMessage", {
    name: "No Inspiration Message",
    hint: `Add a custom message when inspiration is removed and there is no remaining inspiration. Use the key $$NAME$$ for "The party," the character's name, or the player's name in that order and $$INSPIRATION_NAME$$ for the name of the inspiration resource. Example: "$$NAME$$ attempted to use $$INSPIRATION_NAME$$, but doesn't have any!"`,
    scope: "world",
    config: true,
    type: String,
    default: MESSAGE_CONSTANTS.NO_INSPIRATION,
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

  game.soInspired = { 
    AddInspiration: addInspiration,
    Inspiration: inspirationHandler,
    RemoveInspiration: removeInspiration,
    MessageHandler: new SIMessageHandler() 
  };

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

Hooks.on("getChatMessageContextOptions", (element, items) => {
  const inspirationName = game.settings.get("so-inspired", "inspirationName");
  items.push({
    name: "Reroll Using " + inspirationName,
    callback: (html) => {
      rerollDice(html);
    },
    condition: (html) => {
      const message = game.messages.get(html.dataset.messageId);
      const isRerollOrRerolled = message.flags["so-inspired"]?.isReroll
        ? true
        : message.flags["so-inspired"]?.rerolled
        ? true
        : false;
      if (
        (message.author.isSelf || game.user.isGM) &&
        message.rolls.find((roll) => roll.validD20Roll === true)
      ) {
        if (
          (!isRerollOrRerolled &&
            game.settings.get("so-inspired", "oneReroll")) ||
          !game.settings.get("so-inspired", "oneReroll")
        )
          return true;
      }
      return false;
    },
    icon: `<i class="fa fa-repeat" aria-hidden="true"></i>`,
  });
});

async function rerollDice(html) {
  const message = game.messages.get(html.dataset.messageId);

  const actorUuid = "Actor." + message.speaker.actor;
  const sheet = (await fromUuid(actorUuid)).sheet;
  const user = game.users.find((u) => u.character?.uuid === actorUuid);

  await removeInspiration(user, sheet).then(
    async (resolveMessage) => {
      game.soInspired.MessageHandler.toChat({
        speaker: message.speaker,
        message: resolveMessage,
      });
      const roll = message.rolls[0];
      const reroll = await roll.reroll();
      const flavor = !message.flags["so-inspired"]?.isReroll
        ? message.flavor +
          ` (Reroll using ${game.settings.get(
            "so-inspired",
            "inspirationName"
          )})`
        : message.flavor;

      const flags = { ...message.flags, "so-inspired.isReroll": true };
      message.updateSource({
        ...message.flags,
        "flags.so-inspired.rerolled": true,
      });

      await reroll.toMessage({
        flags: flags,
        speaker: message.speaker,
        flavor: flavor,
      });
    },
    (rejectMessage) => {
      game.soInspired.MessageHandler.toChat({
        speaker: message.speaker,
        message: rejectMessage,
      });
    }
  );
}

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
  if (_sheet.id.split("-")[0] === "Tidy5eCharacterSheet") {
    renderTidySheet(_sheet, html);
  } else renderNewInspoSheet(_sheet, html);
});

Hooks.on("updateUser", (user) => {
  updateSheetForInspo(user);
});

Hooks.on("renderPlayers", () => {
  if (game.settings.get("so-inspired", "showInspirationOnPlayerList"))
    updatePlayerListInspo();
});

function renderTidySheet(app, element) {
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
  if (actorOwner || game.user.isGM) {
    currentInspiration = game.settings.get(
      "so-inspired",
      "useSharedInspiration"
    )
      ? game.settings.get("so-inspired", "sharedInspiration")
      : actorOwner.getFlag("so-inspired", "inspirationCount");

    const api = game.modules.get("tidy5e-sheet").api;

    let newInspirationArea = api.useHandlebarsRendering(`
      <div
        class="counter flexrow new-inspiration"
        style="width: 200px; height: 25px; display: flex; margin: 10px 10px 10px 10px; margin-bottom: 25px"
      >
        <h4>${game.settings.get("so-inspired", "inspirationName")}</h4>
        <span class="inspiration-span" style="margin-left: 10px">
            ${currentInspiration}
        </span>
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
        </div>
      </div>`);

    html.find(".tidy5e-sheet-header").after(newInspirationArea);

    const speaker = {
      actor: app.actor.id,
      alias: app.actor.name,
      scene: game.scenes?.active.id,
      token: app.actor.token,
    };

    $(html)
      .find(".add-inspiration-btn")
      .off("click")
      .on("click", async function () {
        await addInspiration(actorOwner, app).then(
          (resolveMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: resolveMessage,
              speaker: speaker,
            });
            ui.players.render();
          },
          (rejectMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: rejectMessage,
              speaker: speaker,
            });
          }
        );
      });
    $(html)
      .find(".remove-inspiration-btn")
      .off("click")
      .on("click", async function () {
        await removeInspiration(actorOwner, app).then(
          (resolveMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: resolveMessage,
              speaker: speaker,
            });
            ui.players.render();
          },
          (rejectMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: rejectMessage,
              speaker: speaker,
            });
          }
        );
      });
  }
}

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

      const speaker = {
        actor: _sheet.actor.id,
        alias: _sheet.actor.name,
        scene: game.scenes?.active.id,
        token: _sheet.actor.token,
      };

      $(html)
        .find(".add-inspiration-btn")
        .off("click")
        .on("click", async function () {
          await addInspiration(actorOwner, _sheet).then(
            (resolveMessage) => {
              game.soInspired.MessageHandler.toChat({
                message: resolveMessage,
                speaker: speaker,
              });
              ui.players.render();
            },
            (rejectMessage) => {
              game.soInspired.MessageHandler.toChat({
                message: rejectMessage,
                speaker: speaker,
              });
            }
          );
        });
      $(html)
        .find(".remove-inspiration-btn")
        .off("click")
        .on("click", async function () {
          await removeInspiration(actorOwner, _sheet).then(
            (resolveMessage) => {
              game.soInspired.MessageHandler.toChat({
                message: resolveMessage,
                speaker: speaker,
              });
              ui.players.render();
            },
            (rejectMessage) => {
              game.soInspired.MessageHandler.toChat({
                message: rejectMessage,
                speaker: speaker,
              });
            }
          );
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
    if (_sheet && _sheet.rendered) _sheet.render(true);
    updatePlayerList();
    return Promise.resolve(
      game.settings.get("so-inspired", "addInspirationMessage")
    );
  } else {
    return Promise.reject(
      game.settings.get("so-inspired", "maxInspirationMessage")
    );
  }
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

    if (_sheet && _sheet.rendered) _sheet.render(true);
    updatePlayerList();
    return Promise.resolve(
      game.settings.get("so-inspired", "removeInspirationMessage")
    );
  } else {
    return Promise.reject(
      game.settings.get("so-inspired", "noInspirationMessage")
    );
  }
}

function updateSheetForInspo(user) {
  if (user?.character?.sheet.rendered) {
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

  new foundry.applications.api.DialogV2({
    window: { title: "Inspiration!" },
    content: await foundry.applications.handlebars.renderTemplate(
      "modules/so-inspired/templates/inspirationHandler.hbs",
      options
    ),
    buttons: [{
      action: "confirm",
      label: "Confirm",
      default: true,
      callback: (event, button, dialog) => button.form.elements.user.value
    }, {
      action: "cancel",
      label: "Cancel"
    }],
    submit: async (result) => {
      if (result === 'cancel')
          return;

      if (result === null || result === '') {
        ui.notifications.error(`A user was not selected.`);
        return;
      }
      
      await inspirationHandlerResponse(result);
    }
  }).render({ force: true });
}

async function inspirationHandlerResponse(result) {
  if (result === "all") {
    for (const user of game.users) {
      const speaker = {
        actor: user.character?.id,
        alias: user.character?.name,
        scene: game.scenes?.active.id,
        token: user.character?.token,
      };
      if (!user.isGM) {
        await addInspiration(user).then(
          (resolveMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: resolveMessage,
              speaker: speaker,
            });
            ui.players.render();
          },
          (rejectMessage) => {
            game.soInspired.MessageHandler.toChat({
              message: rejectMessage,
              speaker: speaker,
            });
          }
        );
      }
    }
    
    return;
  }

  const user = game.users.get(result);
  const speaker = {
    actor: user.character?.id,
    alias: user.character?.name,
    scene: game.scenes?.active.id,
    token: user.character?.token,
  };
  addInspiration(user).then(
    (resolveMessage) => {
      game.soInspired.MessageHandler.toChat({
        message: resolveMessage,
        speaker: speaker,
      });
      ui.players.render();
    },
    (rejectMessage) => {
      game.soInspired.MessageHandler.toChat({
        message: rejectMessage,
        speaker: speaker,
      });
    }
  );
}