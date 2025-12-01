// ======================================================
// Express + HubSpot Custom Object Integration
// ======================================================

const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// ------------------------------
// Middleware
// ------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ------------------------------
// Load HubSpot Credentials
// ------------------------------
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const CUSTOM_OBJECT = process.env.HUBSPOT_OBJECT_TYPE; // MUST BE p244493727_ai_tool

console.log("🚀 USING HUBSPOT OBJECT TYPE:", CUSTOM_OBJECT);

if (!HUBSPOT_ACCESS_TOKEN || !CUSTOM_OBJECT) {
  console.error("❌ Missing HUBSPOT_ACCESS_TOKEN or HUBSPOT_OBJECT_TYPE");
  process.exit(1);
}

// Axios instance
const hubspot = axios.create({
  baseURL: "https://api.hubapi.com",
  headers: {
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  }
});

// ======================================================
// GET /  — Homepage showing custom object records
// ======================================================
app.get('/', async (req, res) => {
  try {
    console.log("📡 Sending GET request to HubSpot...");

    const response = await hubspot.get(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      params: {
        limit: 100,
        archived: false,
        properties: ["name", "category", "description"]
      },
      paramsSerializer: params => {
        return Object.keys(params)
          .map(key => {
            const value = params[key];
            if (Array.isArray(value)) {
              return value.map(v => `${key}=${encodeURIComponent(v)}`).join("&");
            }
            return `${key}=${encodeURIComponent(value)}`;
          })
          .join("&");
      }
    });

    console.log("🔥 HUBSPOT RESPONSE DATA:");
    console.log(JSON.stringify(response.data, null, 2));

    const records = response.data.results || [];

    res.render('homepage', {
      title: "AI Tools List",
      records
    });

  } catch (err) {
    console.error("❌ Error fetching records:");
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to load records.");
  }
});

// ======================================================
// GET /update-cobj — Show the form
// ======================================================
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum"
  });
});

// ======================================================
// POST /update-cobj — Create a new AI tool record
// ======================================================
app.post('/update-cobj', async (req, res) => {
  const { name, category, description } = req.body;

  try {
    console.log("📝 Creating new custom object record...");

    await hubspot.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      properties: { name, category, description }
    });

    console.log("✅ New record created successfully.");
    res.redirect('/');

  } catch (err) {
    console.error("❌ Error creating record:");
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to create new record.");
  }
});

// ======================================================
// Start Server
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
