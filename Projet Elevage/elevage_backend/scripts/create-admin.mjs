
import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { createInterface } from 'node:readline/promises';

async function askHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;

    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      reject(new Error('Lance ce script dans un terminal interactif.'));
      return;
    }

    let value = '';
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
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN'",
    );

    if (Number(rows[0].total) > 0) {
      console.log('Un administrateur existe déjà. Opération annulée.');
      return;
    }

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const nom = (await rl.question('Nom de l administrateur : ')).trim();
    const email = (await rl.question('Adresse email : ')).trim().toLowerCase();

    rl.close();

    if (!nom || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Nom ou adresse email invalide.');
    }

    const password = await askHidden('Mot de passe (12 caractères minimum) : ');
    const confirmation = await askHidden('Confirme le mot de passe : ');

    if (password.length < 12) {
      throw new Error('Le mot de passe doit contenir au moins 12 caractères.');
    }

    if (password !== confirmation) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO users (nom, email, password, role, status)
       VALUES (?, ?, ?, 'ADMIN', 1)`,
      [nom, email, hashedPassword],
    );

    console.log('\nAdministrateur créé avec succès !');
    console.log(`Nom : ${nom}`);
    console.log(`Email : ${email}`);
    console.log('Rôle : ADMIN');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('\nErreur :', error.message);
  process.exitCode = 1;
});
