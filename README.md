# YouCoder

YouCoder is a browser extension developed using the Plasmo framework.  
The project was bootstrapped with the `plasmo init` command and is designed to help developers build and debug extensions efficiently.

## Features

- Modern browser extension development with the Plasmo framework  
- Built using TypeScript and React  
- Hot-reloading development server  
- Compatible with Chrome Manifest V3  

## Demo

🚧 Demo coming soon!  
*(Screenshots or animated GIFs will be added once the UI is finalized.)*

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
