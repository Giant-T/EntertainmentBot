# Entertainment Bot
Un bot discord implémenté en Typescript à l'aide de la librairie [Discord.js](https://discord.js.org/).

### Commandes du bot
--------------------
### `/profil {utilisateur}`
Affiche le profil d'un utilisateur

### `/recherchefilm {requete}`
Affiche une liste de film selon la requête

### `/hello`
Hello, World!

### `/chat`

### Commandes
-------------
Dans le dossier du projet vous pouvez lancer les commandes suivantes:

### `yarn start`
Transpile le Typescript en javascript et exécute le programme grâce à nodejs.

### `yarn fmt`
Formate tous les fichiers contenus dans le dossier `src` à l'aide de prettier.

### `yarn build`
Transpile le Typescript en javascript pour qu'il puisse être exécuter par la suite.

### `.\create_command.ps1`
Crée une nouvelle commande dans le dossier `src/commands` et ajoute les dépendances nécessaires dans certains fichiers.

### Comment débuter
-------------------
Lancez la commande `yarn` dans le dossier afin d'installé toute les dépendances du projet.
Lors de chaque commits, la commande de formatage est lancé afin d'assurer un code qui est uniforme.

#### Fichier .env
```sh
# DISCORD
DISCORD_TOKEN='...'
CLIENT_ID='...'

# MOVIE
MOVIE_TOKEN='...'

# DATABASE
HOST='localhost'
PORT=27017
DATABASE='...'
DB_USERNAME='...'
DB_PASSWORD='...'
```

