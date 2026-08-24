import base from "@waslah/config/eslint.config.mjs";

export default [
  ...base,
  {
    ignores: ["next-env.d.ts"],
  },
];
