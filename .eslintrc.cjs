module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: false,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 13,
  },
  rules: {
    'no-console': 'off',
    'linebreak-style': 'off',
    'import/extensions': 0,
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'import/no-unresolved': [2, { commonjs: true, amd: true }],
  },
};
