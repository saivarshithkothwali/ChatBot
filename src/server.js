import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import OpenAI from "openai";
import { upsertRestaurants, queryRestaurants } from "./pineconeClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Initialize Groq Client
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Endpoint to proxy Swiggy API and avoid frontend CORS issues
app.get("/api/get-restaurants", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.swiggy.com/dapi/restaurants/list/v5?lat=18.002668480081386&lng=79.54484011977911&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("Failed to fetch from Swiggy API:", error.message);
    res.status(500).json({ error: "Failed to fetch restaurant data" });
  }
});

// AI Chatbot Endpoint
app.post("/api/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // Query Pinecone
    const relevantRestaurants = await queryRestaurants(message);

    console.log("Restaurants returned from Pinecone:");
    console.log(relevantRestaurants);

    const restaurantText = relevantRestaurants
      .map(
        (r) =>
          `${r.name} (Rating: ${r.rating}, Cuisines: ${r.cuisines.join(", ")})`,
      )
      .join("\n");

    const prompt = `
You are an expert assistant for FoodExpress.

User Question:
"${message}"

Answer ONLY using the restaurant data below.

If no relevant data exists, say:
"I could not find any relevant restaurant information."

Restaurant Data:
${restaurantText || "No data found."}
`;

    // Generate answer using Groq
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = response.choices[0].message.content;

    res.json({ answer });
  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      error: "Something went wrong in the chatbot",
    });
  }
});
app.get("/test", async (req, res) => {
  try {
    const result = await queryRestaurants("best pizza");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

app.get("/api/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=18.002668480081386&lng=79.54484011977911&restaurantId=${id}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.error("Menu Fetch Error:", error.message);

    res.status(500).json({
      error: "Failed to fetch menu",
    });
  }
});

// Upsert restaurant data into Pinecone
app.post("/api/upsert-restaurants", async (req, res) => {
  try {
    const { restaurants } = req.body;

    if (!restaurants || !Array.isArray(restaurants)) {
      return res.status(400).json({
        error: "A 'restaurants' array is required.",
      });
    }

    await upsertRestaurants(restaurants);

    res.json({
      message: "Restaurants upserted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to upsert restaurants",
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
