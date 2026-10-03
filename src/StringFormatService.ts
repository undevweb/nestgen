import {EntityNameCaseInterface} from "./EntityNameCaseInterface";
import pluralize from 'pluralize';

export class StringFormatService{
    constructor() {
    }


    toEntityCase(entityNameKebabCase : string) : EntityNameCaseInterface {
        return {
            pascalCase : this.toPascalCase(entityNameKebabCase),
            kebabCase : entityNameKebabCase,
            camelCase : this.toCamelCase(entityNameKebabCase),
            snakeCase : this.toSnakeCase(entityNameKebabCase),
            capitalCase : entityNameKebabCase.toUpperCase(),
            kebabCasePlural : this.kebabToPlural(entityNameKebabCase)
        }
    }

    /**
     * kebab-case → PascalCase
     * user-profile → UserProfile
     */
    toPascalCase(kebab: string): string {
        return kebab
            .split("-")
            .map(this.capitalize)
            .join("");
    }

    /**
     * kebab-case → camelCase
     * user-profile → userProfile
     */
    toCamelCase(kebab: string): string {
        const [first, ...rest] = kebab.split("-");
        return first + rest.map(this.capitalize).join("");
    }

    /**
     * kebab-case → snake_case
     * user-profile → user_profile
     */
    toSnakeCase(kebab: string): string {
        return kebab.replace(/-/g, "_");
    }

    /**
     *
     * @param word
     */
    capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    kebabToPlural(value: string): string {
        return pluralize(value);
    }

    fromPascalToSnakeCase(word: string): string{
        return word
            // Ajoute un underscore entre minuscule/numérique et majuscule
            .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
            // Gère les acronymes : "HTTPServer" → "HTTP_Server"
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .toLowerCase();
    }

}
