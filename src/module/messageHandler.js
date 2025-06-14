export class SIMessageHandler {
  async toChat({
    author = game.users.current.id,
    message = undefined,
    speaker = {
      actor: game.user.character?.id,
      alias: game.user.character?.name,
      scene: game.scenes?.active.id,
      token: game.user.character?.token.id,
    },
  } = {}) {
    const formattedMessage = this.formatString(
      message,
      speaker?.alias ?? game.users.get(author).name
    );
    await ChatMessage.create({
      author: author,
      flavor: formattedMessage,
      speaker: speaker,
    });
  }
  toDebug() {}
  toWarning() {}
  toError() {}

  formatString(message, name) {
    return message
      .replaceAll("$$NAME$$", name)
      .replaceAll(
        "$$INSPIRATION_NAME$$",
        game.settings.get("so-inspired", "inspirationName")
      );
  }
}
