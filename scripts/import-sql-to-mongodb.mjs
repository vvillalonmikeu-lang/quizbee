// To use, run `node --experimental-modules import-sql-to-mongodb.mjs [path/to/quizbee.sql]`

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import dns from "node:dns";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MongoClient } from "mongodb";

const execFileAsync = promisify(execFile);

async function loadLocalEnvFile() {
  const envFiles = [".env.local", ".env"];

  for (const envFile of envFiles) {
    try {
      const fileContents = await fs.readFile(path.resolve(envFile), "utf8");

      for (const line of fileContents.split(/\r?\n/)) {
        const trimmedLine = line.trim();

        if (!trimmedLine || trimmedLine.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");

        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        let value = trimmedLine.slice(separatorIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }

      return envFile;
    } catch {
    }
  }

  return null;
}

await loadLocalEnvFile();

const sqlFilePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("quizbee (1).sql");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

async function configureDnsForSrvUri(connectionUri) {
  if (!connectionUri.startsWith("mongodb+srv://")) {
    return;
  }

  const configuredServers = process.env.MONGODB_DNS_SERVER
    ? process.env.MONGODB_DNS_SERVER.split(",").map((item) => item.trim()).filter(Boolean)
    : [];

  if (configuredServers.length > 0) {
    dns.setServers(configuredServers);
    return;
  }

  const hostname = new URL(connectionUri).hostname;
  const srvName = `_mongodb._tcp.${hostname}`;

  try {
    await dns.promises.resolveSrv(srvName);
    return;
  } catch {
  }

  try {
    const { stdout } = await execFileAsync("nslookup", ["-type=SRV", srvName]);
    const lines = stdout.split(/\r?\n/);
    const serverLineIndex = lines.findIndex((line) => line.trim().startsWith("Server:"));

    if (serverLineIndex >= 0) {
      for (let index = serverLineIndex + 1; index < lines.length; index += 1) {
        const match = lines[index].match(/Address:\s+([^\s]+)/i);

        if (match) {
          dns.setServers([match[1]]);
          return;
        }
      }
    }
  } catch {
  }
}

function resolveDatabaseName(connectionUri) {
  if (process.env.MONGODB_DB) {
    return process.env.MONGODB_DB;
  }

  try {
    const parsed = new URL(connectionUri);
    const pathname = (parsed.pathname || "").replace(/^\//, "");
    return pathname || "quizbee";
  } catch {
    return "quizbee";
  }
}

function extractInsertStatements(sqlText) {
  return [...sqlText.matchAll(/INSERT INTO\s+`questions`\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi)];
}

function splitTuples(valuesBlock) {
  const tuples = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let index = 0; index < valuesBlock.length; index += 1) {
    const character = valuesBlock[index];
    const nextCharacter = valuesBlock[index + 1];

    if (character === "'") {
      current += character;

      if (inString && nextCharacter === "'") {
        current += nextCharacter;
        index += 1;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (!inString && character === "(") {
      if (depth > 0) {
        current += character;
      }
      depth += 1;
      continue;
    }

    if (!inString && character === ")") {
      depth -= 1;

      if (depth === 0) {
        tuples.push(current);
        current = "";
        continue;
      }
    }

    if (depth > 0) {
      current += character;
    }
  }

  return tuples;
}

function splitFields(tupleText) {
  const fields = [];
  let current = "";
  let inString = false;

  for (let index = 0; index < tupleText.length; index += 1) {
    const character = tupleText[index];
    const nextCharacter = tupleText[index + 1];

    if (character === "'") {
      current += character;

      if (inString && nextCharacter === "'") {
        current += nextCharacter;
        index += 1;
        continue;
      }

      inString = !inString;
      continue;
    }

    if (!inString && character === ",") {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current) {
    fields.push(current.trim());
  }

  return fields;
}

function parseSqlValue(value) {
  if (/^NULL$/i.test(value)) {
    return "";
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value
      .slice(1, -1)
      .replace(/''/g, "'")
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }

  return value;
}

function mapQuestionDocument(columns, values) {
  const row = columns.reduce((record, columnName, index) => {
    record[columnName] = parseSqlValue(values[index] || "");
    return record;
  }, {});

  return {
    section: row.section,
    difficulty: row.difficulty,
    question: row.question,
    answer: row.answer,
    choice_a: row.choice_a || "",
    choice_b: row.choice_b || "",
    choice_c: row.choice_c || "",
    choice_d: row.choice_d || "",
    updatedAt: new Date()
  };
}

async function main() {
  await configureDnsForSrvUri(uri);

  const sqlText = await fs.readFile(sqlFilePath, "utf8");
  const statements = extractInsertStatements(sqlText);

  if (statements.length === 0) {
    throw new Error(`No questions INSERT statements found in ${sqlFilePath}.`);
  }

  const documents = [];

  for (const [, columnBlock, valuesBlock] of statements) {
    const columns = [...columnBlock.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    const tuples = splitTuples(valuesBlock);

    for (const tuple of tuples) {
      const values = splitFields(tuple);
      documents.push(mapQuestionDocument(columns, values));
    }
  }

  const client = await new MongoClient(uri).connect();
  const database = client.db(resolveDatabaseName(uri));
  const collection = database.collection("questions");

  await collection.createIndex(
    { section: 1, difficulty: 1, question: 1 },
    { unique: true }
  );

  if (documents.length > 0) {
    await collection.bulkWrite(
      documents.map((document) => ({
        updateOne: {
          filter: {
            section: document.section,
            difficulty: document.difficulty,
            question: document.question
          },
          update: {
            $set: document,
            $setOnInsert: { createdAt: new Date() }
          },
          upsert: true
        }
      }))
    );
  }

  await client.close();

  console.log(`Imported ${documents.length} questions into MongoDB.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});