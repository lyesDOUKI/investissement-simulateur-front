# Investissement · Simulateur

Application Expo / React Native pour construire un portefeuille d'exemple, préparer des allocations et simuler leur évolution sur iOS, Android et le web.

## Démarrer

```bash
npm install
npx expo start
```

Utilisez `npx expo start --web` pour la version navigateur. Expo Router sert les mêmes écrans sur iOS, Android et le web.

## Parcours V0

- Lire la valeur du portefeuille, ses versements, sa répartition et les plans actifs depuis un tableau de bord adaptatif.
- Préparer un versement ponctuel ou un plan DCA hebdomadaire, mensuel ou trimestriel.
- Composer chaque investissement en plusieurs lignes **ISIN + montant**. Le total et les lignes restent synchronisés, chaque code ISIN est vérifié et l'allocation doit être équilibrée avant l'enregistrement.
- Valoriser un versement ou un plan existant à une date donnée.
- Comparer un versement unique à des versements réguliers dans le simulateur.
- Consulter les opérations et allocations de la session.

Les valeurs, rendements et instruments du catalogue sont fictifs. Les opérations sont conservées en mémoire et réinitialisées au rechargement de l'application. Aucun ordre n'est transmis à un intermédiaire financier.

## Architecture

- `src/domain` contient les modèles métier et le port `PortfolioRepository`, sans dépendance à Expo ou React Native.
- `src/application` contient les cas d'usage et la validation métier.
- `src/infrastructure/fake` fournit le repository fictif, injecté dans les cas d'usage par `src/infrastructure/dependencies.ts`.
- `src/presentation/screens` contient les écrans du tableau de bord, de l'investissement, de la simulation, de la valorisation et de l'activité.
- `src/presentation/components` regroupe les éléments d'interface communs ; `src/app` assemble les parcours Expo Router.

## Qualité

```bash
npx expo lint
npx tsc --noEmit
```
