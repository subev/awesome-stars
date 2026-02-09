export type AwesomeListConfig = {
  name: string;
  slug: string;
  readmeUrl: string;
};

export const AWESOME_LISTS: Record<string, AwesomeListConfig> = {
  neovim: {
    name: "Awesome Neovim",
    slug: "neovim",
    readmeUrl:
      "https://raw.githubusercontent.com/rockerBOO/awesome-neovim/refs/heads/main/README.md",
  },
  nodejs: {
    name: "Awesome Node.js",
    slug: "nodejs",
    readmeUrl:
      "https://raw.githubusercontent.com/sindresorhus/awesome-nodejs/refs/heads/main/readme.md",
  },
};
