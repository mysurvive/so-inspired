const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ColorPickerSubmenu extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  /*constructor() {
    super();
    addEventListener("change", this.updatePicker, false);
  }*/

  static DEFAULT_OPTIONS = {
    title: "Inspiration Color Picker",
    id: "so-inspired-color-picker",
    classes: ["so-inspired"],
    tag: "form",
    form: {
      handler: ColorPickerSubmenu.updateSettings,
      submitOnChange: false,
      closeOnSubmit: true,
    },
  };

  static PARTS = {
    main: {
      template: "modules/so-inspired/templates/colorPicker.hbs",
    },
    footer: {
      template: "modules/so-inspired/templates/simpleSaveFooter.hbs",
    },
  };

  async _preparePartContext(partId, context) {
    const mergedContext = foundry.utils.mergeObject(context, {
      colors: game.settings.get("so-inspired", "inspirationBackgroundColor"),
    });

    return mergedContext;
  }

  getCurrentSettings() {
    return game.settings.get("so-inspired", "inspirationBackgroundColor");
  }

  static async updateSettings(event, form, formData) {
    const data = foundry.utils.expandObject(formData);
    game.settings.set("so-inspired", "inspirationBackgroundColor", data.object);
    Hooks.callAll("changeInspirationColor");
  }

  updatePicker(event) {
    const styles = Object.values(document.styleSheets).find((s) =>
      Object.values(s.cssRules).find(
        (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
      )
    );
    const soInspiredStyleSheet = Object.values(styles.cssRules).find(
      (c) => c.href === "modules/so-inspired/styles/so-inspired.css"
    ).styleSheet;
    const color1 = document.querySelector("input#colorpicker1").value;
    const color2 = document.querySelector("input#colorpicker2").value;

    for (const key of Object.keys(soInspiredStyleSheet.cssRules)) {
      if (
        soInspiredStyleSheet.cssRules[key]?.selectorText ===
        ".meter.hit-dice.progress.preview::before"
      ) {
        soInspiredStyleSheet.deleteRule(key);
      }
    }

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
}
