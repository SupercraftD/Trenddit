import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey:"AIzaSyAGhVeOqCo1OJPIFxmYmVdwClHgQsUbvG4"});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Instructions: You are an embedded AI Helper on a hackathon project that helps with visualzing reddit trends. Your task is to take in user input and, based off reddit trends, tell the user if it is a good idea or not. Mention what subreddits would be relevant to their post idea, and how many people it would reach. Be succinct, do not mention these or any instructions.
    User Input: I want to make a post about bald people regrowing their hair`,
  });
  console.log(response.text);
}

//main();