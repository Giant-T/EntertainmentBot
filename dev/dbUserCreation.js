conn = Mongo();
db = conn.getDB('discordbot');

db.createUser({
  user: 'discordbot',
  pwd: 'ilovemovies',
  roles: [{ role: 'readWrite', db: 'discordbot' }],
});
