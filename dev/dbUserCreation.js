db.createUser({
  user: 'discordbot',
  pwd: 'ilovemovies',
  roles: [{ role: 'readWrite', db: 'discordbot' }],
});
