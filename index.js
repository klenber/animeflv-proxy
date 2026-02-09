import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const BASE = "https://www3.animeflv.net";

/* ======================
   BUSCAR ANIME
====================== */
app.get("/animeflv/search", async (req, res) => {
  try {
    const q = req.query.q;
    const { data } = await axios.get(`${BASE}/browse?q=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);

    const results = [];

    $("ul.ListAnimes li").each((_, el) => {
      const a = $(el).find("a");
      results.push({
        id: a.attr("href").replace("/anime/", ""),
        titulo: a.find("h3").text().trim(),
        imagen: a.find("img").attr("src"),
        tipo: "serie"
      });
    });

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: "search failed" });
  }
});

/* ======================
   EPISODIOS
====================== */
app.get("/animeflv/episodes/:id", async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE}/anime/${req.params.id}`);
    const $ = cheerio.load(data);

    const episodes = [];

    $("ul.ListEpisodes li a").each((_, el) => {
      episodes.push({
        numero: $(el).text().trim(),
        url: $(el).attr("href")
      });
    });

    res.json(episodes.reverse());
  } catch (e) {
    res.status(500).json({ error: "episodes failed" });
  }
});

/* ======================
   VIDEO REAL
====================== */
app.get("/animeflv/video", async (req, res) => {
  try {
    const { data } = await axios.get(req.query.url);
    const match = data.match(/https?:\/\/[^"]+\.(mp4|m3u8)/);

    if (!match) return res.status(404).json({ error: "video not found" });

    res.json({ video: match[0] });
  } catch (e) {
    res.status(500).json({ error: "video failed" });
  }
});

app.listen(3000, () => console.log("🔥 AnimeFLV proxy listo"));
