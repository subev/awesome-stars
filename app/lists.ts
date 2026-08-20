export type AwesomeListConfig = {
  name: string;
  slug: string;
  owner: string;
  repo: string;
  readmeUrl: string;
};

export const AWESOME_LISTS: Record<string, AwesomeListConfig> = {
  awesome: {
    name: "Awesome",
    slug: "awesome",
    owner: "sindresorhus",
    repo: "awesome",
    readmeUrl:
      "https://raw.githubusercontent.com/sindresorhus/awesome/refs/heads/main/readme.md",
  },
  neovim: {
    name: "Awesome Neovim",
    slug: "neovim",
    owner: "rockerBOO",
    repo: "awesome-neovim",
    readmeUrl:
      "https://raw.githubusercontent.com/rockerBOO/awesome-neovim/refs/heads/main/README.md",
  },
  nodejs: {
    name: "Awesome Node.js",
    slug: "nodejs",
    owner: "sindresorhus",
    repo: "awesome-nodejs",
    readmeUrl:
      "https://raw.githubusercontent.com/sindresorhus/awesome-nodejs/refs/heads/main/readme.md",
  },
  javascript: {
    name: "Awesome JavaScript",
    slug: "javascript",
    owner: "sorrycc",
    repo: "awesome-javascript",
    readmeUrl:
      "https://raw.githubusercontent.com/sorrycc/awesome-javascript/refs/heads/master/README.md",
  },
  ai: {
    name: "Awesome Artificial Intelligence",
    slug: "ai",
    owner: "owainlewis",
    repo: "awesome-artificial-intelligence",
    readmeUrl:
      "https://raw.githubusercontent.com/owainlewis/awesome-artificial-intelligence/refs/heads/master/README.md",
  },
  "macos-apps": {
    name: "Open Source macOS Apps",
    slug: "macos-apps",
    owner: "serhii-londar",
    repo: "open-source-mac-os-apps",
    readmeUrl:
      "https://raw.githubusercontent.com/serhii-londar/open-source-mac-os-apps/refs/heads/master/README.md",
  },
};
