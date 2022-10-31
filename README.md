# HYBUS-GENESIS

> HYBUS Project based on React

## Picture
<img width="370" alt="메인화면" src="https://user-images.githubusercontent.com/59571464/199035127-8f9b67ca-81b3-40e6-8662-5750282915b3.png">

## Project Rules

### **IMPORTANT NOTICE**

🚫 DO NOT USE `NPM`. This project is based on `yarn`.

🙏 Self merge is not recommended. Please request review at least one member. We are happy to read your code.

💡 You must pass all ESLint check. If it wasn't, hysky script will prohibit to commit.

🚀 When you open PR, ReviewDog will automatically check ESLint rules and suggest changes. Please fix them all.

✍️ You should signing your commit with gpg key.

<br />

### Gitflow
🏗️ `main` branch is for deploying to production automatically.

🏗️ `dev` branch is for release candidate.

🩹 Every new feature branch should have prefix `feature/`

🎉 Every Bugfix branch should have prefix `fix/`





## Installation

Clone this repository and run `yarn`.

### Run local dev server

`yarn run dev`


### Run local production server

`yarn run serve`


### Build project

`yarn run build`

Output directory is `dist`.

[vite-compression plugin](https://www.npmjs.com/package/vite-plugin-compression) will automatically compress output files. Default algorith is `gzip`.


