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
    // 'import/extensions': 'always',
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
  },
};
