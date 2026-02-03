module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        '**/*.js',
        '!**/*.test.js',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/examples*.js',
        '!**/test*.js',
        '!jest.config.js',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    testMatch: [
        '**/tests/**/*.test.js',
    ],
    verbose: true,
};
