# Welcome to [Awesome Neovim](https://github.com/rockerBOO/awesome-neovim/) list extended with Stargazers count!

<img width="1270" height="619" alt="image" src="https://github.com/user-attachments/assets/8fe3fd2a-3661-40b9-994a-fa94b76530ae" />



## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 💾 PostgreSQL + DrizzleORM
- 📖 [React Router docs](https://reactrouter.com/)
- TailwindCSS for styling
- Eslint and Prettier for code quality

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

you also need .env file with the following variables:

``` GITHUB_TOKEN ``` - A GitHub personal access token.

You need to run the following just once (if not developing the script itself)

```bash
npm run fetch-stars
```

### Development

Copy `.env.example` to `.env` and provide a GITHUB_TOKEN.

Run an initial database migration:

```bash
npm run db:migrate
```

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
