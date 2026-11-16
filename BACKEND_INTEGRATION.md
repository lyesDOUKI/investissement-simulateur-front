# Intégration backend locale

Copier `.env.example` vers `.env.local`, renseigner le secret du mock OIDC local, puis redémarrer Expo après chaque modification des variables `EXPO_PUBLIC_*`. Ces variables sont embarquées dans le client : le secret de mock ne doit jamais être réutilisé hors développement.

`EXPO_PUBLIC_API_URL` désigne la base de l'API complète, suffixe `/api` compris. L'adaptateur envoie un bearer token, sérialise les dates en ISO, convertit les allocations vers les enums `UNIT_LINKED` / `EURO_FUND` et mappe les réponses vers les modèles de présentation. Sur émulateur Android, le défaut est `10.0.2.2`; sur appareil physique, utiliser l'adresse LAN de la machine. Le navigateur doit pouvoir joindre le mock OIDC et l'API (CORS).

## Éléments actuellement absents de l'API

- Le JWT fournit `sub`, prénom, nom et e-mail ; il ne fournit pas téléphone ni date de création du compte. Le profil affiche explicitement ces deux valeurs comme non fournies.
- Les endpoints de liste et de valorisation ne fournissent pas de résumé global de portefeuille ni une liste de cours/supports. Le tableau de bord n'invente pas de totaux ; le catalogue des trois ISIN de démonstration reste une donnée locale de présentation.
- La comparaison est masquée par `EXPO_PUBLIC_FEATURE_COMPARISON=false`, car aucune route de comparaison n'est publiée.
- La spec définit les réponses paginées des listes ; le client demande une page de 100 éléments. Une pagination supérieure à 100 n'est pas encore parcourue automatiquement.

Le front ne calcule ni parts, ni valeur, ni gain : les champs sont ceux des réponses de création, détail et simulation.
