#!/usr/bin/env node

// import chalk from "chalk";
import inquirer from "inquirer";
// import gradient from "gradient-string";
// import chalkAnimation from "chalk-animation";
// import figlet from "figlet";
// import { createSpinner } from "nanospinner";
// "gradient-string": "^2.0.0",
// "chalk": "^5.0.0",
// "figlet": "^1.5.2",
// "chalk-animation": "^1.6.0",
// "nanospinner": "^1.0.0"
import { createHash, createDecipheriv } from "crypto";
import { readFileSync } from "fs";

import { exit } from "process";

import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

import imageToAscii from "image-to-ascii";

const myArgs = process.argv.slice(2);
let adventure_key;

let adventureJSON;

if (myArgs.length != 1) {
  console.log("usage: npm adventure-cli adventure_name");
  exit(1);
} else {
  adventure_key = myArgs[0];
  if (
    !createHash("md5").update(adventure_key).digest("hex").startsWith("e0ebc3")
  ) {
    console.log("given adventure is not valid");
    exit(1);
  } else {
    const algorithm = "aes-256-ctr";
    let key = createHash("sha256")
      .update(String(adventure_key))
      .digest("base64")
      .substr(0, 32);

    const decrypt = (encrypted) => {
      const iv = encrypted.slice(0, 16);
      encrypted = encrypted.slice(16);
      const decipher = createDecipheriv(algorithm, key, iv);
      const result = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return result;
    };

    adventureJSON = JSON.parse(
      decrypt(readFileSync(`${__dirname}/database.json`)).toString()
    );
  }
}

let current = "008";

async function mainLoop() {
  while (true) {
    console.log(current);
    let current_data = adventureJSON[current];

    for (let i = 0; i < current_data.length; i++) {
      await handleNode(current_data[i]);
    }
  }
}

async function handleNode(item) {
  if (item.type === "text") {
    console.clear();
    console.log(item.content);
    await promptContinue();
  } else if (item.type === "image") {
    console.clear();

    let image_path = `${__dirname}/images/${item.filename}`;

    imageToAscii(
      image_path,
      { size: { height: process.stdout.rows - 2 } },
      (err, converted) => {
        console.log(err || converted);
      }
    );

    const sleep = (ms = 500) => new Promise((r) => setTimeout(r, ms));

    await sleep();

    // imagePromise.then(success => {
    await promptContinue();
    // })
  } else if (item.type === "choice") {
    const choice = await inquirer.prompt({
      name: "null",
      type: "list",
      message: "Which option will you choose?",
      choices: [item.choices[0].content, item.choices[1].content],
    });

    if (choice === item.choices[0].content) {
      current = item.choices[0].link;
    } else {
      current = item.choices[1].link;
    }
  } else if (item.type === "ending") {
    console.log("The End");
    exit(0);
  } else {
    console.log("Error handling node type");
    exit(1);
  }
}

async function promptContinue() {
  await inquirer.prompt({
    name: "Continue",
    type: "list",
    message: "",
    choices: ["..."],
  });
}

// console.log(chalk.bgGreen("hi world!"));

// const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

// async function welcome() {
//   const rainbowTitle = chalkAnimation.rainbow(
//     "Who wants to be a millionaire \n"
//   );

//   await sleep();
//   rainbowTitle.stop();

//   //   console.log($``)
// }

// async function question1() {
//   const answers = await inquirer.prompt({
//     name: "question_1",
//     type: "list",
//     message: "Javascript was created in 10 days then released on \n",
//     choices: ["May 23rd, 1995", "Dec 4th, 1995"],
//   });

//   return handleAnswer(answers.question_1 == "Dec 4th, 1995");
// }

// async function handleAnswer(isCorrect) {
//   const spinner = createSpinner("Checking answer...").start();

//   if (isCorrect) {
//     spinner.success({ text: `Nice work, thaweiof` });
//   } else {
//     spinner.error({ text: `saefgrhtsef` });
//     process.exit(1);
//   }
// }

// function winner() {
//   console.clear();
//   const msg = `Congrats, asehioshgiur`;

//   figlet(msg, (err, data) => {
//     console.log(gradient.pastel.multiline(data));
//   });
// }

// await welcome();
// await question1();
// await winner();

mainLoop();
