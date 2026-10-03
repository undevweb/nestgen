# nestgen

CLI interactif qui génère des modules NestJS selon l'architecture de la flotte UNDEVWEB
(`C:\www\UNDEVWEB\stacks\nestjs.md`) : un dossier par domaine avec `Api/Controller`, `Api/Dto`,
`Database/Entity`, `Database/Repository` (+ `providers.ts`), `Interface`, `Manager`, `Service`, et
les barrels `index.ts`.

## Utilisation

```bash
pnpm install
pnpm start generate        # = ts-node src/index.ts generate
# ou, après `pnpm run build` et un lien global : nestgen generate
```

Le CLI demande le chemin du projet NestJS (par défaut le dossier courant) puis le nom du module
(Entrée pour quitter). Il lance `nest g mo <nom>` dans le projet (`@nestjs/cli` requis) puis
rend les templates EJS de `templates/` (entity, interface, DTO post/put, repository, providers,
manager, controller, index, module).

Les modèles supposent la couche commune `src/app/` du kit `nestjs-kit-starter-full`
(`AbstractAppController`, `AppManager`, `AbstractAppRepository`).

`pnpm run copy:templates` copie les templates dans `dist/` (commande `robocopy`, Windows).
