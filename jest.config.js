// see https://jestjs.io/docs/en/configuration#transformignorepatterns-array-string
const packagesToTransformWithBabel = ['ethereum-cryptography/src/keccak'];

const transformIgnorePatterns = [
  `<rootDir>/node_modules/(?!(${packagesToTransformWithBabel.join('|')}))`,
  '/node_modules/(?!axios)/',
];

module.exports = {
  transformIgnorePatterns,
  moduleFileExtensions: ['js', 'json', 'ts'],
  preset: 'ts-jest',
  // rootDir: 'src',
  moduleDirectories: ['node_modules', 'src'], // to account for baseUrl in tsconfig.json
  // testRegex: '.*\\/.*\\.spec\\.ts$',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
};
