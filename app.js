const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

app.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: "Missing query" });
  const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    const $ = cheerio.load(response.data);
    const firstLink = $("a.a-link-normal.s-no-outline").attr("href");
    if (firstLink) {
      const fullLink = `https://www.amazon.com${firstLink}`;
      res.json({ link: fullLink });
    } else {
      res.json({ link: "" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to scrape" });
  }
});

app.listen(3000, () => console.log("Price tracker running on port 3000"));
