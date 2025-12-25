
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function checkModels() {
    console.log("Checking models via RAW REST API...");
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error("❌ API Error:", data.error.message);
        } else if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log("⚠️ No models found or unexpected format:", data);
        }
    } catch (error) {
        console.error("❌ Network/Fetch Error:", error);
    }
}

checkModels();
