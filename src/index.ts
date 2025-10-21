#!/usr/bin/env node
import fs from "fs";
import path from "path";
import ejs from "ejs";
import inquirer from "inquirer";
import { Command } from "commander";

const program = new Command();

function renderTemplate(templateFile: string, outputFile: string, data: any) {
    const templatePath = path.join(__dirname, "..", "templates", templateFile);
    const template = fs.readFileSync(templatePath, "utf8");
    const content = ejs.render(template, data);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, content);

    console.log(`✅ Created: ${outputFile}`);
}

async function main() {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "entityName",
            message: "Nom de l'entité :",
            validate: (input) => input ? true : "Vous devez entrer un nom valide"
        },
        {
            type: "input",
            name: "projectPath",
            message: "Chemin du projet NestJS (ou laissez vide pour le dossier courant) :",
            default: process.cwd()
        }
    ]);

    const { entityName, projectPath } = answers;
    const entityLower = entityName.toLowerCase();

    const entityDir = path.join(projectPath, "src", "entities");
    const repoDir = path.join(projectPath, "src", "repositories");

    renderTemplate("entity.ts.ejs", path.join(entityDir, `${entityLower}.entity.ts`), { entityName, entityLower });
    renderTemplate("repository.ts.ejs", path.join(repoDir, `${entityLower}.repository.ts`), { entityName, entityLower });

    console.log("🎉 Tous les fichiers ont été générés !");
}

program
    .command("generate")
    .description("Générer une entité et son repository")
    .action(main);

program.parse(process.argv);
