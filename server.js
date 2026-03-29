const express = require("express");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// 🔑 CONFIG
const SUPABASE_URL = "TON_URL";
const SUPABASE_KEY = "TON_KEY";
const GOOGLE_API = "TA_GOOGLE_KEY";
const BREVO_API = "TA_BREVO_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🚀 LOOP AUTO
setInterval(runCycle, 60000); // toutes les 60s

async function runCycle() {
  console.log("Scan en cours...");

  const leads = await scanGoogle();

  for (const lead of leads) {
    const exists = await checkDuplicate(lead.name);
    if (exists) continue;

    const score = scoreLead(lead);

    await saveLead({ ...lead, score });

    if (score > 70) {
      await sendEmail(lead);
    }
  }
}

// 🔍 GOOGLE
async function scanGoogle() {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=plombier+france&key=${GOOGLE_API}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results.map(p => ({
    name: p.name,
    address: p.formatted_address,
    website: p.website || null
  }));
}

// 🧠 SCORING
function scoreLead(lead) {
  if (!lead.website) return 90;
  return 40;
}

// 💾 DB
async function saveLead(lead) {
  await supabase.from("leads").insert([lead]);
}

// ❌ DOUBLON
async function checkDuplicate(name) {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("name", name);

  return data.length > 0;
}

// ✉️ EMAIL
async function sendEmail(lead) {
  console.log("Email envoyé à", lead.name);

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: "you@business.com" },
      to: [{ email: "test@mail.com" }],
      subject: "Gagnez plus de clients",
      htmlContent: `<p>${lead.name}, je peux vous aider.</p>`
    })
  });
}

app.get("/", (req, res) => {
  res.send("HexaBoost IA actif 🚀");
});

app.listen(3000, () => console.log("Server lancé"));
