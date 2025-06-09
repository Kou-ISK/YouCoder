/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss)$": "identity-obj-proxy"
  },
  testMatch: ["**/__tests__/**/*.(ts|tsx|js)", "**/*.(test|spec).(ts|tsx|js)"],
  collectCoverageFrom: [
    "src/lib/**/*.(ts|tsx)",
    "src/components/**/*.(ts|tsx)",
    "lib/**/*.(ts|tsx)",
    "components/**/*.(ts|tsx)",
    "!**/*.d.ts",
    "!**/node_modules/**"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          verbatimModuleSyntax: false,
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          jsx: "react-jsx",
          types: ["node", "jest"]
        }
      }
    ]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/build/",
    "<rootDir>/__tests__/helpers/MockFileReader.ts"
  ],
  extensionsToTreatAsEsm: [],
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"]
}
