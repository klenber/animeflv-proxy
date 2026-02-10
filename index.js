import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
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
    const { id } = req.params;

    const url = `https://animeflv.net/anime/${id}`;
    const html = await axios.get(url).then(r => r.data);
    const $ = cheerio.load(html);

    const episodes = [];

    $("ul.ListCaps li a").each((_, el) => {
      const epUrl = $(el).attr("href");
      if (epUrl) {
        episodes.push({
          url: "https://animeflv.net" + epUrl
        });
      }
    });

    res.json(episodes.reverse());
  } catch (e) {
    console.error("❌ Episodes error", e);
    res.json([]);
  }
});


/* ======================
   VIDEO REAL
====================== */
app.get("/animeflv/video", async (req, res) => {
  try {
    const episodeUrl = req.query.url;

    const html = await axios.get(episodeUrl).then(r => r.data);
    const $ = cheerio.load(html);

    let videoUrl = null;

    $("iframe").each((_, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("embed")) {
        videoUrl = src;
      }
    });

    if (!videoUrl) {
      return res.json({ error: "video not found" });
    }

    // redirección al embed
    const embedHtml = await axios.get(videoUrl).then(r => r.data);
    const _$ = cheerio.load(embedHtml);

    let finalVideo = null;

    _$("script").each((_, el) => {
      const txt = _$(el).html();
      if (txt && txt.includes(".m3u8")) {
        const match = txt.match(/https?:\/\/[^"]+\.m3u8/);
        if (match) finalVideo = match[0];
      }
    });

    if (!finalVideo) {
      return res.json({ error: "stream not found" });
    }

    res.json({ video: finalVideo });
  } catch (e) {
    console.error("❌ Video error", e);
    res.json({ error: "video error" });
  }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 AnimeFLV proxy corriendo en puerto", PORT);
});




