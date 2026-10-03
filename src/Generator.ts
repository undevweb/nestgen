import inquirer from "inquirer";
import {GenerateModule} from "./generators/GenerateModule";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import {renderTemplate} from "./functions/render-template";
import {StringFormatService} from "./StringFormatService";

type ComponentType = "entity" | "repository" | "controller" | "postdto" | "putdto" | "interface" | "manager";
const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export class Generator {

    projectPath: string;
    generateModule: GenerateModule;
    stringFormatService: StringFormatService;
    currentModule: string | null = null;

    // Templates mapping
    templatesMap: Record<ComponentType, string> = {
        entity: "entity.ts.ejs",
        repository: "repository.ts.ejs",
        controller: "controller.ts.ejs",
        postdto: "post.ts.ejs",
        putdto: "put.ts.ejs",
        interface: "interface.ts.ejs",
        manager: "manager.ts.ejs"
    };


    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.generateModule = new GenerateModule(this.projectPath);
        this.stringFormatService = new StringFormatService();
    }

    async run() {
        let continueLoop = true;

        while (continueLoop) {

            if (this.currentModule) {
                const choiceGenerate = await this.showMenuGenerate();
                continueLoop = await this.manageChoiceGenerate(choiceGenerate);
            }

            if (this.currentModule === null) {
                let choiceModule = await this.showMenuModule();

                if (choiceModule === "newmodule") {
                    choiceModule = await this.generateModule.generate();
                }

                if (!choiceModule || choiceModule == "quit") {
                    continueLoop = false;
                    console.log("👋 Sortie du CLI.");
                    break;
                }

                // Si on arrive là alors choiceModule contient le nom d'un module
                this.setCurrentModule(choiceModule);
            }
        }
    }

    private async manageChoiceGenerate(choiceGenerate: string | undefined): Promise<boolean> {
        if (!choiceGenerate || choiceGenerate == "quit") {
            console.log("👋 Sortie du CLI.");
            return false;
        }

        if (choiceGenerate === "back") {
            this.setCurrentModule(null);
            return true;
        }

        if (choiceGenerate === "index") {
            this.generateAllIndexes();
            console.log("🎉 Génération des index terminée !");
        }

        if (choiceGenerate === "entity") {
            await this.generateForEntities();
            this.generateAllIndexes();
            console.log("🎉 Génération terminée pour les entités !");
            return true;
        }


        return true;
    }

    generateAllIndexes() {
        const paths: Record<ComponentType, string> = this.getPaths();
        this.generateIndexFile(paths.repository, 'REPOSITORIES');
        this.generateIndexFile(paths.controller, 'CONTROLLERS');
        this.generateIndexFile(path.join(this.projectPath, "src", this.currentModule ?? "", "Service"), 'SERVICES');
        this.generateIndexFile(paths.manager, 'MANAGERS');
        this.generateProvidersFile(paths.repository);
    }

    async generateForEntities(): Promise<boolean> {

        if (!this.currentModule) {
            console.error("Le module en cours n'a pas été défini");
            return false;
        }

        let continueLoop = true;
        do {
            continueLoop = await this.generateForEntity();
        } while (continueLoop);

        return true;
    }

    async generateForEntity() {

        const {entityName} = await inquirer.prompt([
            {
                type: "input",
                name: "entityName",
                message: "Nom de l'entité (kebab-case)(ou ENTER pour quitter) :",
                validate(input: string) {
                    if (input.trim().length !== 0 && !KEBAB_CASE_REGEX.test(input)) {
                        return "❌ Le nom doit être en kebab-case (ex: user-profile)";
                    }
                    return true;
                },
            },
        ]);

        if (!entityName) {
            return false; // quitter la boucle
        }

        const entityCase = this.stringFormatService.toEntityCase(entityName);

        // Choix des composants à générer
        const {components} = await inquirer.prompt([
            {
                type: "checkbox",
                name: "components",
                message: `Que voulez-vous générer pour "${entityCase.camelCase}" ?`,
                choices: ["entity", "repository", "controller", "postdto", "putdto", "interface", "manager"],
                default: ["entity", "repository", "controller", "postdto", "putdto", "interface", "manager"]
            }
        ]);

        const paths: Record<ComponentType, string> = this.getPaths();

        // Générer les fichiers
        components.forEach((type: ComponentType) => {
            const templateFile = this.templatesMap[type];
            const outputFile = path.join(paths[type], `${entityCase.pascalCase}${this.stringFormatService.capitalize(type)}.ts`);
            renderTemplate(templateFile, outputFile, entityCase);
        });

        return true;
    }

    getPaths(): Record<ComponentType, string> {
        return {
            entity: path.join(this.projectPath, "src", this.currentModule ?? "", "Database", "Entity"),
            repository: path.join(this.projectPath, "src", this.currentModule ?? "", "Database", "Repository"),
            controller: path.join(this.projectPath, "src", this.currentModule ?? "", "Api", "Controller"),
            postdto: path.join(this.projectPath, "src", this.currentModule ?? "", "Api", "Dto"),
            putdto: path.join(this.projectPath, "src", this.currentModule ?? "", "Api", "Dto"),
            interface: path.join(this.projectPath, "src", this.currentModule ?? "", "Interface"),
            manager: path.join(this.projectPath, "src", this.currentModule ?? "", "Manager")
        }
    }

    setCurrentModule(currentModule: string | null) {
        this.currentModule = currentModule;
    }

    async showMenuGenerate() {
        const {genType} = await inquirer.prompt([
            {
                type: "list",          // menu avec sélection unique
                name: "genType",
                message: `[${this.currentModule}] Que voulez-vous générer ?`,
                choices: [
                    {name: "Index et Providers", value: "index"},
                    {name: "Entité", value: "entity"},
                    // {name: "Repository", value: "repository"},
                    // {name: "Service", value: "service"},
                    // {name: "Controller", value: "controller"},
                    {name: "Retour", value: "back"},
                    {name: "Quitter", value: "quit"}
                ],
                default: "entity"
            },
        ]);

        return genType
    }

    async showMenuModule() {

        const modules = this.getModules();

        const {module} = await inquirer.prompt([
            {
                type: "list",          // menu avec sélection unique
                name: "module",
                message: "Choisir un module",
                choices: [
                    ...modules.map(module => ({name: module, value: module})),
                    {name: "Créer un nouveau module", value: "newmodule"},
                    {name: "Quitter", value: "quit"}
                ],
                default: "newmodule"
            },
        ]);

        return module;
    }

    private getModules(): string[] {
        const srcPath = path.join(this.projectPath, "src");

        if (!fs.existsSync(srcPath)) {
            return [];
        }

        return fs
            .readdirSync(srcPath, {withFileTypes: true})
            .filter(dirent => dirent.isDirectory() && !(['app', 'database', 'logger'].includes(dirent.name.toLowerCase())))
            .map(dirent => dirent.name);
    }

    /**
     * Génère un fichier index.ts pour n'importe quel dossier.
     *
     * @param dir - Chemin du dossier à scanner
     * @param exportVarName - Nom de la variable exportée
     * @param filter - Fonction optionnelle pour filtrer les fichiers
     */
    generateIndexFile(
        dir: string,
        exportVarName: string,
        filter?: (file: string) => boolean
    ) {
        if (!fs.existsSync(dir)) {
            console.warn(`⚠️ Dossier non trouvé: ${dir}`);
            return;
        }

        const files = this.getAllTsFiles(dir, dir, filter);

        const imports: string[] = [];
        const exportsArr: string[] = [];

        files.forEach((relativeFile) => {
            const withoutExt = relativeFile.replace(/\.ts$/, '');
            const name = path.basename(withoutExt);

            const className = name
                .split(/[\.-]/)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');

            const importPath = './' + withoutExt.replace(/\\/g, '/');

            imports.push(`import { ${className} } from '${importPath}';\n`);
            exportsArr.push(className);
        });

        const templatePath = path.join(__dirname, '..', 'templates', 'index.ts.ejs');

        const content = ejs.render(
            fs.readFileSync(templatePath, 'utf8'),
            {
                imports,
                exports: exportsArr,
                exportVarName,
            },
        );

        fs.writeFileSync(path.join(dir, 'index.ts'), content);
        console.log(`✅ Index ${exportVarName} généré`);
    }

    getAllTsFiles(
        dir: string,
        baseDir: string,
        filter?: (filePath: string) => boolean,
    ): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        return entries.flatMap((entry) => {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                return this.getAllTsFiles(fullPath, baseDir, filter);
            }

            if (
                entry.isFile() &&
                entry.name.endsWith('.ts') &&
                entry.name !== 'index.ts' &&
                entry.name !== 'providers.ts' &&
                !entry.name.startsWith('Abstract')
            ) {
                const relativePath = path.relative(baseDir, fullPath);
                return filter && !filter(relativePath) ? [] : [relativePath];
            }

            return [];
        });
    }

    generateProvidersFile(
        dir: string,
        filter?: (file: string) => boolean
    ) {
        if (!fs.existsSync(dir)) {
            console.warn(`⚠️ Dossier non trouvé: ${dir}`);
            return;
        }

        const files = fs.readdirSync(dir)
            .filter(f => f.endsWith(".ts") && f !== "index.ts" && f !== "providers.ts" && !f.startsWith('Abstract'))
            .filter(f => (filter ? filter(f) : true));

        const imports: string[] = [];
        const providers: { name: string, nameEntity: string }[] = [];

        files.forEach(file => {
            const nameEntity = path.basename(file, ".ts").replace('Repository', 'Entity');
            const name = this.stringFormatService.fromPascalToSnakeCase(
                nameEntity.replace('Entity', '')
            ).toUpperCase();
            imports.push(`import { ${nameEntity} } from '../Entity/${nameEntity}';\n`);
            providers.push({name, nameEntity});
        });

        const templatePath = path.join(__dirname, "..", "templates", "providers.ts.ejs");
        const content = ejs.render(fs.readFileSync(templatePath, "utf8"), {
            imports,
            providers,
        });

        fs.writeFileSync(path.join(dir, "providers.ts"), content);
        console.log(`✅ PROVIDERS : ${path.join(dir, "providers.ts")}`);
    }

}
