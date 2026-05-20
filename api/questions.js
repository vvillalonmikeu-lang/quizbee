const { getQuestionsCollection } = require("../lib/mongodb");

const MULTIPLE_CHOICE_ROUNDS = new Set(["EASY", "INTERMEDIATE"]);

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildGroupedQuestions(items) {
  return items.reduce((grouped, item) => {
    const level = item.section;
    const round = item.difficulty;

    if (!grouped[level]) {
      grouped[level] = {};
    }

    if (!grouped[level][round]) {
      grouped[level][round] = [];
    }

    grouped[level][round].push({
      question: item.question,
      choice_a: item.choice_a || "",
      choice_b: item.choice_b || "",
      choice_c: item.choice_c || "",
      choice_d: item.choice_d || "",
      answer: item.answer
    });

    return grouped;
  }, {});
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!rawBody) {
    return {};
  }

  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody);
}

function validateQuestionInput(payload) {
  const level = normalizeText(payload.level).toUpperCase();
  const round = normalizeText(payload.round).toUpperCase();
  const question = normalizeText(payload.question);
  const answer = normalizeText(payload.answer);
  const choiceA = normalizeText(payload.choice_a);
  const choiceB = normalizeText(payload.choice_b);
  const choiceC = normalizeText(payload.choice_c);
  const choiceD = normalizeText(payload.choice_d);

  if (!level || !round || !question || !answer) {
    return {
      error: "Level, round, question, and answer are required."
    };
  }

  if (MULTIPLE_CHOICE_ROUNDS.has(round) && (!choiceA || !choiceB || !choiceC || !choiceD)) {
    return {
      error: "All four choices are required for EASY and INTERMEDIATE rounds."
    };
  }

  return {
    value: {
      section: level,
      difficulty: round,
      question,
      answer,
      choice_a: MULTIPLE_CHOICE_ROUNDS.has(round) ? choiceA : "",
      choice_b: MULTIPLE_CHOICE_ROUNDS.has(round) ? choiceB : "",
      choice_c: MULTIPLE_CHOICE_ROUNDS.has(round) ? choiceC : "",
      choice_d: MULTIPLE_CHOICE_ROUNDS.has(round) ? choiceD : "",
      updatedAt: new Date()
    }
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const collection = await getQuestionsCollection();

    if (req.method === "GET") {
      const questions = await collection
        .find({}, { projection: { _id: 0, section: 1, difficulty: 1, question: 1, choice_a: 1, choice_b: 1, choice_c: 1, choice_d: 1, answer: 1 } })
        .sort({ section: 1, difficulty: 1, question: 1 })
        .toArray();

      sendJson(res, 200, buildGroupedQuestions(questions));
      return;
    }

    if (req.method === "POST") {
      const payload = await readBody(req);
      const validated = validateQuestionInput(payload);

      if (validated.error) {
        sendJson(res, 400, { error: validated.error });
        return;
      }

      const document = validated.value;

      await collection.updateOne(
        {
          section: document.section,
          difficulty: document.difficulty,
          question: document.question
        },
        {
          $set: document,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      sendJson(res, 200, { ok: true, message: "Question saved successfully." });
      return;
    }

    sendJson(res, 405, { error: "Method not allowed." });
  } catch (error) {
    sendJson(res, 500, {
      error: "Failed to process questions request.",
      details: error.message
    });
  }
};
