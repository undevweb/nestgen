import inquirer from "inquirer";
import {exec} from "child_process";
import path from "path";
import fs from "fs";
import {renderTemplate} from "../functions/render-template";
import {StringFormatService} from "../StringFormatService";

export class GenerateModule {

    projectPath:string;
    folders :string[] =  [
        "Api",
        "Api/Controller",
        "Api/Dto",
        "Database",
        "Database/Entity",
        "Database/Repository",
        "Interface",
        "Manager",
        "Service"
    ];
    stringFormatService: StringFormatService;

    constructor(projectPath:string) {
        this.projectPath = projectPath;
        this.stringFormatService = new StringFormatService();
    }

    async generate():Promise<string>{

        const { moduleName } = await inquirer.prompt([
            {
                type: "input",
                name: "moduleName",
                message: "Nom du module (ou ENTER pour quitter) :",
            },
        ]);

        if (!moduleName) {
            return "quit"; // quitter la boucle
        }

        const moduleDir = path.join(this.projectPath, "src", moduleName);
        if (fs.existsSync(moduleDir)){
            console.log(`Le module ${moduleDir} existe déjà`);
            return moduleName;
        }

        console.log("Création du module " + moduleName);
        await this.generateModuleFromNest(this.projectPath, moduleName);
        this.initModule(this.projectPath, moduleName);

        console.log(`✅ Module "${moduleName}" généré et initialisé.`);
        return moduleName;
    }

    async generateModuleFromNest(projectPath: string, moduleName: string) {
        return new Promise<void>((resolve, reject) => {
            const cmd = `nest g mo ${moduleName}`;
            exec(cmd, { cwd: projectPath }, (err, stdout, stderr) => {
                if (err) {
                    console.error("❌ Erreur lors de la génération du module:", stderr);
                    return reject(err);
                }
                console.log(stdout);
                resolve();
            });
        });
    }

    initModule(projectPath: string, moduleName: string) {
        const moduleDir = path.join(projectPath, "src", moduleName);

        this.folders.forEach(dir => {
            const fullPath = path.join(moduleDir, dir);
            if (!fs.existsSync(fullPath)){
                fs.mkdirSync(fullPath);
            }
        });
        const moduleCase = this.stringFormatService.toEntityCase(moduleName);
        renderTemplate("module.ts.ejs", path.join(projectPath, 'src', moduleCase.kebabCase, `${moduleCase.kebabCase}.module.ts`), moduleCase);
    }


}
