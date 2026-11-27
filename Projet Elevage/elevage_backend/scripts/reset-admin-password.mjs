import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { createInterface } from 'node:readline/promises';

async function askHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    let value = '';

    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Utilise un terminal interactif.'));
      return;
    }

    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (char) => {
      if (char === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        reject(new Error('Opération annulée.'));
        return;
      }

      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
        return;
      }

      if (char === '\u007f' || char === '\b') {
        value = value.slice(0, -1);
      } else if (char >= ' ') {
        value += char;
      }
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'elevage_db',
  });

  try {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const email = (await rl.question('Email de l administrateur : '))
      .trim()
      .toLowerCase();

    rl.close();

    const [users] = await connection.execute(
      "SELECT id FROM users WHERE email = ? AND role = 'ADMIN'",
      [email],
    );

    if (users.length !== 1) {
      throw new Error('Administrateur introuvable ou résultat ambigu.');
    }

    const password = await askHidden('Nouveau mot de passe : ');
    const confirmation = await askHidden('Confirmer le mot de passe : ');

    if (password.length < 12) {
      throw new Error('Minimum 12 caractères requis.');
    }

    if (password !== confirmation) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }

    const hash = await bcrypt.hash(password, 12);

    await connection.execute('UPDATE users SET password = ? WHERE id = ?', [
      hash,
      users[0].id,
    ]);

    console.log('Mot de passe administrateur réinitialisé avec succès.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Erreur :', error.message);
  process.exitCode = 1;
});
