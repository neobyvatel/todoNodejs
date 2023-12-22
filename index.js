import inquirer from "inquirer";
import fs from "fs";
import chalk from "chalk";
const filePath = "todo.json";

async function readTodoList() {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("Error reading:", error);
    return [];
  }
}

async function writeTodoList(todoItem, option) {
  try {
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(todoItem, null, 2),
      "utf8"
    );
    console.log(`Task ${option} successfully!`);
  } catch (error) {
    console.log("Error writing:", error);
  }
}

async function main() {
  let todoList = await readTodoList();
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.cyan("Choose an action:"),
      choices: [
        chalk.green("Add a task"),
        chalk.blue("View to-do list"),
        chalk.yellow("Mark as completed"),
        chalk.red("Remove a task"),
        chalk.gray("Exit"),
      ],
    },
  ]);
  const choicesMap = {
    [chalk.green("Add a task")]: "Add a task",
    [chalk.blue("View to-do list")]: "View to-do list",
    [chalk.yellow("Mark as completed")]: "Mark as completed",
    [chalk.red("Remove a task")]: "Remove a task",
    [chalk.gray("Exit")]: "Exit",
  };
  const plainAction = choicesMap[action];
  if (plainAction === "Add a task") {
    const { newTask } = await inquirer.prompt([
      {
        type: "input",
        name: "newTask",
        message: "Enter a new task name:",
      },
    ]);
    let dateTimeObj = null;
    let isValidDateTime = false;
    while (!isValidDateTime) {
      const { date, time } = await inquirer.prompt([
        {
          type: "input",
          name: "date",
          message: "Enter the deadline date of the task (YYYY-MM-DD):",
        },
        {
          type: "input",
          name: "time",
          message: "Enter the deadline time of the task (HH:mm):",
        },
      ]);
      const dateTimeString = `${date}T${time}:00`;
      dateTimeObj = new Date(dateTimeString);
      if (!isNaN(dateTimeObj) && dateTimeObj > new Date()) {
        isValidDateTime = true;
      } else {
        console.log("Invalid date or time.");
      }

      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        year: "numeric",
      }).format(dateTimeObj);

      todoList.push({
        todo: newTask,
        completed: false,
        deadline: formattedDate,
      });
      await writeTodoList(todoList, "added");
    }
  } else if (plainAction === "View to-do list") {
    const isDeadlineMissed = (deadline) => {
      const deadlineDate = new Date(deadline);
      return deadlineDate < new Date();
    };
    console.log("\nTo-Do List:");
    todoList.forEach((item, index) => {
      const deadlineColor = isDeadlineMissed(item.deadline)
        ? chalk.red(item.deadline)
        : chalk.green(item.deadline);

      console.log(
        `${index + 1 + "."}[${item.completed ? "\u2713" : " "}] ${chalk.magenta(
          item.todo
        )}, ${chalk.gray("Due:")} ${deadlineColor}`
      );
    });
  } else if (plainAction === "Mark as completed") {
    const { todoIndex } = await inquirer.prompt([
      {
        type: "number",
        name: "todoIndex",
        message: "Enter the number of the task you want to mark as completed:",
      },
    ]);
    if (todoIndex >= 1 && todoIndex <= todoList.length) {
      todoList[todoIndex - 1].completed = true;
      await writeTodoList(todoList, "marked as completed");
    } else {
      console.log("Invalid task index.");
    }
  } else if (plainAction === "Remove a task") {
    const { todoIndex } = await inquirer.prompt([
      {
        type: "number",
        name: "todoIndex",
        message: "Enter the number of the task you want to remove:",
      },
    ]);
    if (todoIndex >= 1 && todoIndex <= todoList.length) {
      todoList.splice(todoIndex - 1, 1);
      await writeTodoList(todoList, "removed");
    } else {
      console.log("Invalid task index.");
    }
  } else if (plainAction === "Exit") {
    console.log("Exiting...");
    process.exit();
  }
  main();
}
main();
