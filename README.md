# YouCoder

YouCoder is a browser extension developed using the Plasmo framework.  
The project was bootstrapped with the `plasmo init` command and is designed to help developers build and debug extensions efficiently.

## Features

- Modern browser extension development with the Plasmo framework
- Built using TypeScript and React
- Hot-reloading development server
- Compatible with Chrome Manifest V3
- YouTube video tagging with custom button sets
- Timeline tracking with CSV export functionality
- Click-to-jump timeline navigation
- JSON import/export for button set configurations
- Real-time data synchronization with Chrome storage

## Demo

🚧 Demo coming soon!  
_(Screenshots or animated GIFs will be added once the UI is finalized.)_

## Installation

To set up the project locally:

```bash
git clone https://github.com/Kou-ISK/YouCoder.git
cd YouCoder
pnpm install
```

## Development

To start the development server:

```bash
pnpm dev
# or
npm run dev
```

To load the development build in Chrome:

```text
1. Open Chrome and go to chrome://extensions
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the build/chrome-mv3-dev directory
```

## Usage

### Button Set Management

1. **Creating Button Sets**: Use the "セット追加" button to create new button sets
2. **Adding Actions**: Add actions to button sets using the "アクション追加" button
3. **Adding Labels**: Select an action and use "ラベル追加" to add labels

### JSON Import/Export

#### Exporting Button Sets

1. Click the "エクスポート" button in the popup
2. A JSON file will be automatically downloaded with the currently selected button set

#### Importing Button Sets

1. Click the "インポート" button in the popup
2. Select a JSON file with the correct format
3. The extension will validate and import the button set

#### JSON Format

Button sets can use either the **simple format** (string array) or the **categorized format** (object with categories).

**Simple Format (Legacy):**

```json
{
  "setName": "SOCCER",
  "buttons": [
    {
      "action": "pass",
      "labels": ["short pass", "long pass", "through pass"]
    },
    {
      "action": "shot",
      "labels": ["penalty", "free kick", "corner kick"]
    }
  ]
}
```

**Categorized Format (Recommended):**

```json
{
  "setName": "TENNIS",
  "buttons": [
    {
      "action": "serve",
      "labels": {
        "Result": ["ace", "fault", "double fault"],
        "Type": ["first serve", "second serve"]
      }
    },
    {
      "action": "rally",
      "labels": {
        "Shot Type": ["forehand", "backhand", "volley"],
        "Result": ["winner", "error"]
      }
    }
  ]
}
```

**Label Format Notes:**

- **Simple Format**: Labels are stored as a flat array of strings
- **Categorized Format**: Labels are organized by category (`Record<string, string[]>`)
- The system supports both formats for backward compatibility
- Categorized labels display as `"category - label"` in the timeline and exports
- CSV exports include separate "Labels" and "Categories" columns for categorized data

### Sample Files

The project includes several sample button set files demonstrating both simple and categorized label formats:

- `sample-button-sets.json` - Rugby button set (simple format)
- `sample-soccer.json` - Soccer button set (categorized format)
- `sample-basketball.json` - Basketball button set (categorized format)
- `sample-tennis.json` - Tennis button set (categorized format)

**Categorized Format Benefits:**

- Organized label structure with meaningful categories
- Enhanced CSV export with separate category information
- Improved UI display with category groupings
- Better data analysis capabilities

### Video Tagging

1. Navigate to a YouTube video
2. The tagging panel will appear on the right side
3. Select a team and action to start tagging
4. Click labels to add timestamps
5. Use the timeline panel to view and manage recorded actions
6. Export data as CSV using the export button

### CSV Export

The extension supports CSV export of recorded actions with enhanced support for categorized labels:

**Export Features:**

- All recorded actions with timestamps
- Action names and labels
- Separate category information for categorized labels
- Time-based sorting

**CSV Format:**

- **Simple Labels**: Single "Labels" column with comma-separated values
- **Categorized Labels**:
  - "Labels" column: Display format (`"category - label"`)
  - "Categories" column: Category names extracted from labels

**Example CSV Output:**

```csv
Action,Labels,Categories,Timestamp
serve,"Result - ace, Type - first serve","Result, Type",00:01:23
rally,"Shot Type - forehand","Shot Type",00:01:45
```

## Project Structure

```text
.
├── popup.tsx           # Entry point for the popup UI
├── content.tsx         # Entry point for content script
├── components/         # Reusable React components
├── lib/                # Utility functions and services
├── styles/             # CSS or styling resources
├── docs/               # Project documentation
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project metadata and dependencies
└── ...
```

## Technologies Used

- [Plasmo](https://docs.plasmo.com/)
- React
- TypeScript
- pnpm
- Chrome Extension (Manifest V3)
