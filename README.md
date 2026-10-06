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

## Ce que produit le contrôleur généré

Il s'appuie sur la **garde globale** du kit (`AppModule` : toute route exige un jeton) : aucun `@UseGuards`.
Lecture (`GET`) ouverte à tout compte connecté, écriture (`POST`/`PUT`/`DELETE`) réservée à `@Roles(RolesEnum.ADMIN)`.
Ouvrir une écriture à tout compte n'est valable que pour une action de l'utilisateur sur ses propres données. Après
génération, ajouter le contrôleur à `route-policy.spec.ts` du projet puis régénérer `route-policy.json`.

Le module généré est **formaté avec le Prettier du projet cible** (`pnpm exec prettier --write src/<module>`), pour
passer `format:check` en CI ; sans Prettier dans le projet, un avertissement demande de lancer `pnpm run format`.
