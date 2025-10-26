#!/usr/bin/env node
import fs from "fs";
import path from "path";
import ejs from "ejs";
import inquirer from "inquirer";
import { Command } from "commander";
import {renderTemplate} from "./functions/render-template";

const program = new Command();

// Templates mapping
const templatesMap = {
    entity: "entity.ts.ejs",
    repository: "repository.ts.ejs",
    service: "service.ts.ejs",      // à créer si nécessaire
    controller: "controller.ts.ejs" // à créer si nécessaire
};

// Génération d’une entité + options
async function generateEntity(projectPath: string) {
    const { entityName } = await inquirer.prompt([
        {
            type: "input",
            name: "entityName",
            message: "Nom de l'entité (ou ENTER pour quitter) :",
        },
    ]);

    if (!entityName) {
        return false; // quitter la boucle
    }

    const entityLower = entityName.toLowerCase();

    // Choix des composants à générer
    const { components } = await inquirer.prompt([
        {
            type: "checkbox",
            name: "components",
            message: `Que voulez-vous générer pour "${entityName}" ?`,
            choices: ["entity", "repository", "service", "controller"],
            default: ["entity", "repository"]
        }
    ]);

    type ComponentType = "entity" | "repository" | "service" | "controller";

    const templatesMap: Record<ComponentType, string> = {
        entity: "entity.ts.ejs",
        repository: "repository.ts.ejs",
        service: "service.ts.ejs",
        controller: "controller.ts.ejs"
    };

    const paths: Record<ComponentType, string> = {
        entity: path.join(projectPath, "src", "entities"),
        repository: path.join(projectPath, "src", "repositories"),
        service: path.join(projectPath, "src", "services"),
        controller: path.join(projectPath, "src", "controllers")
    };


    // Générer les fichiers
    components.forEach((type: ComponentType) => {
        const templateFile = templatesMap[type];
        const outputFile = path.join(paths[type], `${entityLower}.${type}.ts`);
        renderTemplate(templateFile, outputFile, { entityName, entityLower });
    });

    return true;
}

// Boucle principale pour plusieurs entités
async function generateEntities(projectPath: string) {
    while (true) {
        const continueLoop = await generateEntity(projectPath);
        if (!continueLoop) break;
    }
    console.log("🎉 Génération terminée !");
}

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

/**
 * Génère un fichier index.ts pour n'importe quel dossier.
 *
 * @param dir - Chemin du dossier à scanner
 * @param exportVarName - Nom de la variable exportée
 * @param filter - Fonction optionnelle pour filtrer les fichiers
 */
export function generateIndexFile(
    dir: string,
    exportVarName: string,
    filter?: (file: string) => boolean
) {
    if (!fs.existsSync(dir)) {
        console.warn(`⚠️ Dossier non trouvé: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith(".ts") && f !== "index.ts")
        .filter(f => (filter ? filter(f) : true));

    const imports: string[] = [];
    const exportsArr: string[] = [];

    files.forEach(file => {
        const name = path.basename(file, ".ts");
        const className = name
            .split(".")
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");

        imports.push(`import { ${className} } from './${name}';`);
        exportsArr.push(className);
    });

    const templatePath = path.join(__dirname, "..", "templates", "index.ts.ejs");
    const content = ejs.render(fs.readFileSync(templatePath, "utf8"), {
        imports,
        exports: exportsArr,
        exportVarName,
    });

    fs.writeFileSync(path.join(dir, "index.ts"), content);
    console.log(`✅ Mis à jour: ${path.join(dir, "index.ts")}`);
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

        await generateEntities(projectPath);
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

program
    .command("gen-index")
    .description("Générer ou mettre à jour un index.ts pour n'importe quel dossier")
    .requiredOption("-d, --dir <dir>", "Chemin du dossier à scanner")
    .requiredOption("-v, --var <varName>", "Nom de la variable exportée")
    .action((options: { dir: string; var: string }) => {
        generateIndexFile(options.dir, options.var);
    });

program.parse(process.argv);
