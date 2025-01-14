import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
	{ ignores: ['dist'] },
	{
		files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.browser
			},
			parserOptions: {
				ecmaVersion: 'latest',
				ecmaFeatures: { jsx: true },
				sourceType: 'module',
			}
		},
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh
		},
		rules: {
			...pluginJs.configs.recommended.rules,
			...reactPlugin.configs.recommended.rules,
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react/jsx-no-target-blank': 'off',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true }
			],
			"max-lines": [
				"error",
				{
					"max": 150,
					"skipComments": true,
					"skipBlankLines": true
				}
			]
		}
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	reactPlugin.configs.flat.recommended, // This is not a plugin object, but a shareable config object
	reactPlugin.configs.flat['jsx-runtime'], // Add this if you are using React 17+
];
