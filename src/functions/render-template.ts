import path from "path";
import fs from "fs";
import ejs from "ejs";

export function renderTemplate(templateFile: string, outputFile: string, data: any) {
    const templatePath = path.join(__dirname, "..", "templates", templateFile);
    const template = fs.readFileSync(templatePath, "utf8");
    const content = ejs.render(template, data);

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, content);

    console.log(`✅ Created: ${outputFile}`);
}
