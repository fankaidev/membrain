module.exports = {
    "roots": [
        "src"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
    },
    "testEnvironment": "jsdom"
};