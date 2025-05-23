require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY === undefined) {
    console.error('OPENAI_API_KEY is not set. Please set it in your environment variables.');
    process.exit(1);
}

async function chatGPTRequest(system_prompt, user_prompt) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4.1',
                messages: [
                    { role: 'system', content: system_prompt },
                    { role: 'user', content: user_prompt }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error contacting OpenAI API:', error);
        throw new Error('Failed to contact OpenAI API');
    }
}

app.get('/api/v1/joke', async (req, res) => {
    try {
        const system_prompt = 'You are a very funny comedian.';
        const user_prompt = `Generate a funny joke. Be creative, humorous and concise.`;
        const joke = await chatGPTRequest(system_prompt, user_prompt);
        res.json({ joke });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate joke' });
    }
});

app.post('/api/v1/translate/:targetLanguage', async (req, res) => {
    const { targetLanguage } = req.params;
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }

    try {
        const system_prompt = `You are a very competent translator. Translate the text to ${targetLanguage}.`;
        const user_prompt = `Translate the following text to ${targetLanguage}. Output only the translation: "${text}"`;
        const translation = await chatGPTRequest(system_prompt, user_prompt);
        res.json({ translation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate translation' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Microservice running on port ${PORT}`);
});
