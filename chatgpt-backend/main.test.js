const request = require('supertest');
const express = require('express');
const axios = require('axios');

jest.mock('axios');

// Minimal test app to match your new API
function createTestApp() {
    const app = express();
    app.use(express.json());

    async function chatGPTRequest(prompt) {
        try {
            const response = await axios.post();
            return response.data.choices[0].message.content;
        } catch (error) {
            throw new Error('Failed to contact OpenAI API');
        }
    }

    app.get('/api/v1/joke', async (req, res) => {
        try {
            const prompt = `Generate a funny joke. Be creative, humorous and concise."`;
            const joke = await chatGPTRequest(prompt);
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
            const prompt = `Translate the following text to ${targetLanguage}. Output only the traduction: "${text}"`;
            const translation = await chatGPTRequest(prompt);
            res.json({ translation });
        } catch (error) {
            res.status(500).json({ error: 'Failed to generate translation' });
        }
    });

    return app;
}

describe('API endpoints', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe('GET /api/v1/joke', () => {
        it('should return a joke', async () => {
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        { message: { content: 'This is a joke.' } }
                    ]
                }
            });
            const res = await request(app)
                .get('/api/v1/joke');
            expect(res.statusCode).toBe(200);
            expect(res.body.joke).toBe('This is a joke.');
        });

        it('should return 500 if OpenAI API fails', async () => {
            axios.post.mockRejectedValue(new Error('API error'));
            const res = await request(app)
                .get('/api/v1/joke');
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to generate joke');
        });
    });

    describe('POST /api/v1/translate/:targetLanguage', () => {
        it('should return a translation when text is provided', async () => {
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        { message: { content: 'Hola mundo' } }
                    ]
                }
            });
            const res = await request(app)
                .post('/api/v1/translate/Spanish')
                .send({ text: 'Hello world' });
            expect(res.statusCode).toBe(200);
            expect(res.body.translation).toBe('Hola mundo');
        });

        it('should return 400 if text is missing', async () => {
            const res = await request(app)
                .post('/api/v1/translate/French')
                .send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing text parameter');
        });

        it('should return 500 if OpenAI API fails', async () => {
            axios.post.mockRejectedValue(new Error('API error'));
            const res = await request(app)
                .post('/api/v1/translate/German')
                .send({ text: 'Hello' });
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to generate translation');
        });
    });
});
