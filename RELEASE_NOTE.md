# Release Notes

## 0.1.1

Community plugin submission compliance and bug fixes.

### Fixes

- **Memory leak prevention**: Proper event listener cleanup on plugin unload
- **API compliance**: Use `getLanguage()` API instead of `moment.locale()` for locale detection
- **Conditional command**: "Add current file to Quick Access" command now properly checks for active file
- **Path normalization**: User-defined file paths now use `normalizePath()` for cross-platform compatibility
- **Core style protection**: Plugin styles no longer override Obsidian core `.view-content` styles

### Improvements

- **Settings UI**: Section headings now use proper `Setting.setHeading()` pattern
- **Sentence case**: All UI text follows Obsidian's sentence case convention
- **File picker**: Now uses Obsidian's `AbstractInputSuggest` for better UX
- **Min app version**: Updated to 1.8.0 for `getLanguage()` API support

### Technical

- Added `destroy()` method chain: `main.ts` → `EmptyStateViewManager` → `SynapticView` → `FloatingButtonManager`
- Fixed `versions.json` to match `manifest.json`
- Copyright year updated to 2026

---

## 0.1.0 (Initial Release)

**Synaptic View** - Don't build a homepage. Configure your Synaptic View.

A dynamic control center that unifies your project hubs, daily notes, task boards, periodic notes, and web resources. No Dataview queries, no maintenance—just intuitive buttons that connect you to what matters.

### Features

- **Unified Dashboard**: Open via command palette or optionally replace new tabs with Synaptic View
- **Quick Access Buttons**: 4 types of smart buttons (File, Web, Journal, Calendar) with customizable icons and order
- **Calendar Integration**: Mini calendar with date/week/month/quarter/year navigation
- **Journal Integration**: Seamless support for Daily Notes and Periodic Notes plugins with auto-creation
- **Daily Note Task Badge**: Real-time display of incomplete tasks with priority system
- **Quick Edit Mode**: Cmd/Ctrl + Click to open files in edit mode alongside preview
- **Settings UI**: Drag-and-drop reordering, file path autocomplete, Lucide icon picker
- **Add Current File Command**: Instantly add current file to Quick Access
- **Multilingual Support**: English and Korean with automatic language detection
- **View Style Options**: Customizable preview-only styling (hide inline title, embedded mentions)

### Technical

- TypeScript with strict type checking
- esbuild-based bundling
- Metadata cache integration for performance
- Responsive CSS with theme compatibility
- Desktop-only (requires Obsidian v1.8.0+)

---

# Future Roadmap

- **Quick Access Grouping**: Organize buttons by color or category
- **Advanced Default View Mode**: Time-based or context-based default views
- **Group Type**: Bundle Quick Access items into collapsible groups
- **Smart Type**: Display recently modified or frequently accessed files
- **Multi Synaptic View**: Multiple view configurations for different contexts (work/personal/study)

---

For detailed usage instructions, see [README.md](./README.md) (English) or [README_KO.md](./README_KO.md) (한국어).

