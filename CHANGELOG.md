# Changelog

## [Unreleased]

## [1.2.1] - 2025-07-06

### Fixed

- Fixed a bug where Color Picker menu wasn't working correctly

## [1.2.0] - 2025-07-06

### Added

- Integrate Inspiration with Tidy 5e Sheets new character sheet ( @kgar )

### Changed

- Update Inspiration Handler from Dialog to DialogV2 ( @thzero )
- Add InspirationHandler, AddInspiration, and RemoveInspiration functions to the global API ( @thzero )

### Fixed

- Fix the Color Picker submenu preview and update to AppV2

## [1.1.1] - 2025-06-14

### Fixed

- Removed accidental debug hook being enabled.

## [1.1.0] - 2025-06-14

### Added

- Add context menu for chat messages to allow rerolls for valid d20 rolls from the chat pane.
- Add One Reroll setting (this only works for context menu rerolls).
- Add settings for custom chat messages for No Inspiration/Remove Inspiration/Add Inspiration/Maximum Inspiration.
- Add CHANGELOG.md.
- Update Github Workflows.
- Add message handler.
- Update 5e minimum versioning to 5.0.3 and verified on FVTT version 13.345.

### Fixed

- Fix SASS deprecation warnings.
- Fix Tidy 5e rendering.

### Security

- Fix NPM package vulnerabilities.
