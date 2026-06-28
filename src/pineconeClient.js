import { Pinecone } from "@pinecone-database/pinecone";
import { InferenceClient } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

// ----------------------
// CLIENTS
// ----------------------

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pineconeClient.index("restaurants");

const hf = new InferenceClient(process.env.HF_TOKEN);

// ----------------------
// EMBEDDINGS
// ----------------------

export async function createEmbedding(text) {
  try {
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    return Array.from(embedding);
  } catch (error) {
    console.error("Embedding Error:", error);
    throw error;
  }
}

// ----------------------
// UPSERT
// ----------------------

export async function upsertRestaurants(restaurants) {
  try {
    const vectors = [];

    for (const restaurant of restaurants) {
      const text = `
Restaurant: ${rest.name}
Cuisines: ${rest.cuisines.join(",")}
Rating: ${rest.rating}
Cost for two: ${rest.costForTwo}
Affordable restaurant
Budget friendly restaurant
Delivery time: ${rest.deliveryTime} minutes
`;

      const embedding = await createEmbedding(text);

      vectors.push({
        id: restaurant.id.toString(),
        values: embedding,
        metadata: restaurant,
      });
    }

    console.log("Embedding Dimension:", vectors[0]?.values?.length);

    await index.upsert(vectors);

    console.log(`Successfully upserted ${vectors.length} restaurant vectors`);
  } catch (error) {
    console.error("Upsert Error:", error);
    throw error;
  }
}

// ----------------------
// QUERY
// ----------------------

export async function queryRestaurants(userQuery) {
  try {
    const queryEmbedding = await createEmbedding(userQuery);

    const response = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    return response.matches.map((match) => match.metadata);
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
}
