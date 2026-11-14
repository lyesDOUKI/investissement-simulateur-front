# Investissement · Simulateur

Application mobile et web Expo / React Native pour simuler des investissements programmés et suivre les opérations d'une session.

## Démarrer

```bash
npm install
npx expo start
```

Utilisez `npx expo start --web` pour la version navigateur. Expo Router sert les mêmes écrans sur iOS, Android et le web.

## Parcours V0

- Créer un versement unique.
- Créer un plan DCA avec montant, jour, fréquence et allocation fictive.
- Simuler un versement ou un plan DCA.
- Valoriser une opération existante à une date choisie.
- Consulter les opérations créées pendant la session.

Les valeurs et rendements sont fictifs. Les opérations sont conservées en mémoire et réinitialisées au rechargement de l'application.

## Architecture

- `src/domain` contient les modèles métier et le port `PortfolioRepository`, sans dépendance à Expo ou React Native.
- `src/application` contient les cas d'usage et la validation métier.
- `src/infrastructure/fake` fournit le repository fictif, injecté dans les cas d'usage par `src/infrastructure/dependencies.ts`.
- `src/app` contient l'interface Expo Router et les parcours de présentation.

## Qualité

```bash
npx expo lint
npx tsc --noEmit
```
