#!/usr/bin/env node
import fs from "fs";
import path from "path";

import inquirer from "inquirer";
import { Command } from "commander";
import {renderTemplate} from "./functions/render-template";
import {Generator} from "./Generator";

const program = new Command();



/**
 * Génère un fichier index.ts dans le dossier controllers
 * en important et exportant tous les controllers existants.
 */
export function generateControllersIndex(controllersDir: string) {
    // Lire tous les fichiers .ts du dossier controllers
    const files = fs.readdirSync(controllersDir).filter(f => f.endsWith(".ts") && !f.endsWith("index.ts"));

    // Générer les importations
    const imports: string[] = [];
    const controllers: string[] = [];

    files.forEach(file => {
        const name = path.basename(file, ".ts"); // ex: user.controller
        // Générer un nom de classe PascalCase pour l'import
        const className = name
            .split(".")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");

        imports.push(`import { ${className} } from './${name}';`);
        controllers.push(className);
    });

    // Générer le contenu du fichier index.ts
    const content = `${imports.join("\n")}

export const CONTROLLERS = [${controllers.join(", ")}];\n`;

    // Écrire dans index.ts
    const indexPath = path.join(controllersDir, "index.ts");
    fs.writeFileSync(indexPath, content);

    console.log(`✅ Mis à jour: ${indexPath}`);
}



async function showMenu(){

}

// Main
async function main() {
    try {

        const { projectPath } = await inquirer.prompt([
            {
                type: "input",
                name: "projectPath",
                message: "Chemin du projet NestJS :",
                default: process.cwd(),
            },
        ]);

        const generator = new Generator(projectPath);
        await generator.run();

    } catch (err: unknown) {
        if (err instanceof Error && err.name === "ExitPromptError") {
            console.log("\n⛔ Prompt interrompu par l'utilisateur. Fermeture du CLI.");
            process.exit(1);
        } else {
            // remonter l'erreur si ce n'est pas un SIGINT
            throw err;
        }
    }
}

program
    .command("generate")
    .description("Générer plusieurs entités avec repository/service/controller")
    .action(main);

// program
//     .command("gen-index")
//     .description("Générer ou mettre à jour un index.ts pour n'importe quel dossier")
//     .requiredOption("-d, --dir <dir>", "Chemin du dossier à scanner")
//     .requiredOption("-v, --var <varName>", "Nom de la variable exportée")
//     .action((options: { dir: string; var: string }) => {
//         generateIndexFile(options.dir, options.var);
//     });

program.parse(process.argv);
