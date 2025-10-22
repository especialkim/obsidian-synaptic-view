# Synaptic View for Obsidian

**English** | [한국어](README_KO.md)

**Don't build a homepage. Configure your Synaptic View.**

---

## Stop Building. Start Configuring.

You've spent hours crafting the perfect homepage note:
- Complex **Dataview queries** that break when your vault structure changes
- Dozens of **internal links** that need constant maintenance
- Endless **scrolling** through a static document to find what you need
- **CSS snippets** and workarounds just to make it look decent

**The problem?** You're stuck in maintenance mode, not creative mode.

---

## Synaptic View Changes the Game

**Stop maintaining a document. Start configuring an interface.**

Synaptic View isn't a note—it's a **dynamic control center** that lives at your fingertips:
- **No coding required**: Pick icons, choose files, toggle buttons on—done in minutes
- **No maintenance**: Your vault structure changes? Your buttons still work
- **No scrolling**: Every destination is one click away, always visible
- **Real-time updates**: See today's tasks without opening notes

**It's not about displaying information. It's about connecting to it instantly.**

**How to use**:
- Open it anytime via command palette: `Open Synaptic View tab`
- Or replace new tabs with Synaptic View for constant access

From janitor to pilot. From static document to living interface. **Configure once, flow forever.**

---

## Core Features

### 1. Unified Dashboard with Instant Access

Synaptic View can be opened in two ways:
- **Via Command**: Run `Open Synaptic View tab` from the command palette (`Ctrl`+`P`)
- **Replace New Tab (Optional)**: Enable **Replace New Tab with Synaptic View** in settings to automatically show Synaptic View whenever you open a new tab

### 2. Quick Access: 4 Types of Smart Buttons

The left side of the action bar always shows **3 default buttons**:
- **➕ New File**: Create a new markdown file and start editing immediately
- **🔍 Search Files**: Open Quick Switcher to find files quickly
- **⚙️ Settings**: Navigate to Synaptic View settings

Your custom **Quick Access buttons** appear to the right. Choose from 4 types:

| Type | Action | When to Use? |
|------|--------|--------------|
| 📄 **File** | Open a specific note or canvas | Frequently accessed documents like project hubs, task boards, reading notes |
| 🌐 **Web** | Open a webpage inside Obsidian | Notion, Google Docs, reference sites (some sites may be restricted) |
| 📅 **Journal** | Open today's/this week's/this month's periodic note | Daily notes, weekly reviews, monthly reflections (auto-creates if missing) |
| 🗓️ **Calendar** | Browse past/future notes via mini calendar | Quickly find notes by date, navigate weekly/monthly notes |

#### 📅 Journal Type Details

Choose your time granularity:
- **Day**: Today's daily note
- **Week**: This week's weekly note
- **Month**: This month's monthly note
- **Quarter**: Current quarter note
- **Year**: This year's yearly note
- **All**: Hovering over the button reveals a **submenu** to select any time granularity

> 💡 **Required**: Core Daily Notes or Periodic Notes plugin must be configured.

#### 🗓️ Calendar Type Details

- **Click button**: Opens today's daily note directly
- **Hover over button**: Mini calendar appears
  - Click a date → Open that day's daily note
  - Click **W** (week number) → Open weekly note
  - Click **MMM** (month) → Open monthly note
  - Click **YYYY** (year) → Open yearly note
  - Click **1Q~4Q** buttons → Open quarterly notes

> 💡 UI automatically adjusts based on your Periodic Notes settings (e.g., hides W column if weekly notes are disabled)

### 3. Today's Tasks at a Glance: Daily Note Task Badge

Journal(Daily) or Calendar buttons display **incomplete task counts** in real-time:
- 🔴 **Red badge + number**: Remaining tasks count
- ✅ **Green checkmark**: All tasks completed!

See what needs to be done today **just by looking at the button**, without opening your daily note.

### 4. Quick Edit Mode Toggle

Quick Access buttons support **two click modes**:

- **Regular click**: Opens file in preview mode in the current tab
- **<kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + Click**: Keeps current tab and opens file in **edit mode (source view)** in a split pane on the right

Hover over an active button while holding <kbd>Cmd</kbd> (macOS) or <kbd>Ctrl</kbd> (Windows/Linux):
- Button icon changes to a **pencil** to indicate editing is available
- Click to **read and write simultaneously**

> 💡 Works with File, Journal, and Calendar types only.

### 5. Style Options

Keep your dashboard clean:
- **Hide inline title**: Hides note titles in preview mode
- **Hide embedded mentions**: Hides decorative link elements

### 6. Intuitive Settings UI

- **Reorder buttons**: Use up/down arrows or drag-and-drop
- **Toggle visibility**: Control which buttons appear
- **Set default view**: Choose which item opens first when Synaptic View launches
- **File path autocomplete**: Type to get vault file suggestions
- **Lucide icon picker**: Search icons (recently used icons appear at the top)

### 7. Add Current File to Quick Access Instantly

Run `Add current file to Quick Access` from the command palette:
- The file you're currently viewing is **automatically added to Quick Access**
- Convenient **quick bookmarking** without opening settings

### 8. Multilingual Support (i18n)

- Supports English and Korean
- **Automatically switches** based on your Obsidian language settings

---

## Installation

### Community Plugin (Recommended)

*(Instructions will be added once submitted to the community plugin list)*

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/especialkim/obsidian-synaptic-view/releases)
2. Copy files to `<Vault>/.obsidian/plugins/obsidian-synaptic-view/`
3. Restart Obsidian and enable **Synaptic View** in **Settings → Community plugins**

> **Compatibility**: Requires Obsidian v0.15.0 or higher. Currently desktop-only.

---

## Quick Start Guide

### Step 1: Open Plugin Settings

Navigate to **Settings → Community plugins → Synaptic View**.

### Step 2: Choose How to Open Synaptic View (Optional)

You can choose between two approaches:
- **Via Command**: Run `Open Synaptic View tab` from command palette (default)
- **Auto Display**: Enable **Replace New Tab with Synaptic View** to automatically show Synaptic View whenever you click the **+** button for a new tab

### Step 3: Add Quick Access Items

Click **"Add New Quick Access"** button:

1. **Select Type**: Choose File, Web, Journal, or Calendar
2. **Configure Details**:
   - **File**: Enter file path (autocomplete suggestions appear as you type)
   - **Web**: Enter URL (e.g., `https://notion.so`)
   - **Journal**: Select time granularity (Day, Week, Month, Quarter, Year, All)
   - **Calendar**: Ready to use without configuration
3. **Choose Icon**: Search Lucide icon library (recently used icons appear at top)
4. **Reorder**: Use up/down arrows or drag-and-drop to adjust order
5. **Enable**: New items are **disabled by default** – toggle them on to display as buttons

> ⚠️ **Important**: After adding an item, **don't forget to enable the toggle!** Disabled items won't appear as buttons.

### Step 4: Set Default View (Optional)

In the **Default View** dropdown, select which item should display first when Synaptic View opens.

### Step 5: Configure Additional Options

- **View Style Options**: Choose whether to hide inline titles and embedded mentions
- **Daily Note Task Badge**: Choose whether to display today's task count on buttons

### Step 6: Start Using!

- Run `Open Synaptic View tab` from command palette (`Ctrl`+`P`), or
- If you enabled new tab replacement, click the **+** button in the tab bar

---

## Usage Tips

### 🎯 Save Space with Journal "All" Button

Instead of creating multiple time-granularity buttons, we recommend **a single "All" button**:
- Hovering over it reveals a **submenu** to instantly select Day/Week/Month/Quarter/Year
- Save button space while maintaining quick access to all periodic notes

### 📆 Using the Calendar Button

- **Quickly open today's note**: Just click the button
- **Find past/future notes**: Hover to open calendar and click a date
- **Weekly review**: Click **W (week number)** on the left to open that week's note
- **Monthly/yearly reflection**: Click **MMM (month)** or **YYYY (year)** at the top
- **Quarterly planning**: Click **1Q~4Q** buttons at the top of calendar for instant quarterly note access

### ✏️ Read and Write Simultaneously

Hold <kbd>Cmd</kbd>/<kbd>Ctrl</kbd> and click a button:
- Preview on the left, edit mode on the right, side by side
- Useful when writing while referencing, or checking edits in real-time

### 🔢 Today's Tasks at a Glance

Enable Daily Note Task Badge (**Settings → Daily Note task badge**):
- Journal(Daily) or Calendar buttons display remaining tasks as a **red number**
- When all complete, it changes to a **green checkmark (✓)** for a sense of achievement
- **Updates in real-time** when you save your daily note

### ⚡ Quick Add from Current File

When viewing a file and thinking "I want this in Quick Access too!":
- Command palette (`Ctrl`+`P`) → `Add current file to Quick Access`
- **Instantly added** without navigating to settings

### 🎨 Build Your Own Workflow

- **By project**: Combine project hub + related task board + web references
- **By routine**: Prioritize Daily Note button in the morning, Weekly Review on weekends
- **By purpose**: Group File buttons for reading, Web buttons for learning

### 💡 Item Not Showing?

- Added to Quick Access but button isn't visible? → **Toggle might be off**
- Check settings and **enable the Enabled toggle** for that item
- Newly added items are disabled by default

---

## FAQ

### Q. Can I use this without Periodic Notes?

A. **Daily Notes Core Plugin** alone is enough for Journal type Day granularity. Week, Month, Quarter, and Year require the **Periodic Notes plugin**.

### Q. Weekly/quarterly/yearly notes aren't showing in Calendar.

A. You must **enable** those time granularities in your Periodic Notes plugin settings. Synaptic View automatically adjusts the UI based on your configuration.

### Q. Daily Note Task Badge isn't updating.

A. Check that the **Show Daily Note task badge** option is enabled in settings. It updates in real-time when you save your daily note.

### Q. Webpages aren't opening with Web type.

A. Some websites (e.g., Google, YouTube) block iframe embedding. These cannot be opened inside Obsidian.

---

## Roadmap

Planned features:

- **Time-based auto view switching**: Task board in the morning, daily note in the evening, etc.
- **Group type**: Bundle Quick Access items into groups
- **Smart type**: Automatically display recently modified or frequently viewed notes
- **Multi Synaptic View**: Create and switch between different view sets per project
- **Keyboard shortcuts**: Quick access to buttons via number keys

---

## Support

This plugin was created by **Yongmini**.

- **Author**: [@Facilitate4U on X](https://x.com/Facilitate4U)
- **Plugin ID**: `obsidian-synaptic-view`

Bug reports, feature suggestions, and user feedback are always welcome!

We hope Synaptic View makes your second brain even more powerful. 🧠✨
