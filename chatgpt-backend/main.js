const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY === undefined) {
    console.error('OPENAI_API_KEY is not set. Please set it in your environment variables.');
    process.exit(1);
}

async function chatGPTRequest(prompt) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4.1',
                messages: [{ role: 'user', content: prompt }],
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

app.post('/api/v1/joke', async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Missing text parameter' });
    }

    try {
        const prompt = `Generate a joke based on the following text: "${text}"`;
        const joke = await chatGPTRequest(prompt);
        res.json({ joke });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate joke' });
    }
});

app.post('/api/v1/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing text or targetLanguage parameter' });
    }

    try {
        const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
        const translation = await chatGPTRequest(prompt);
        res.json({ translation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate translation' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Microservice running on port ${PORT}`);
});
