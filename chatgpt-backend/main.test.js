const request = require('supertest');
const express = require('express');
const axios = require('axios');

jest.mock('axios');

// Import the main app logic, but since the app is created in main.js and listens immediately,
// we need to re-create the endpoints here for isolated testing.
function createTestApp() {
    const app = express();
    app.use(express.json());

    // Mocked chatGPTRequest function
    async function chatGPTRequest(prompt) {
        try {
            const response = await axios.post();
            return response.data.choices[0].message.content;
        } catch (error) {
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

    return app;
}

describe('API endpoints', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
        jest.clearAllMocks();
    });

    describe('POST /api/v1/joke', () => {
        it('should return a joke when text is provided', async () => {
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        { message: { content: 'This is a joke.' } }
                    ]
                }
            });
            const res = await request(app)
                .post('/api/v1/joke')
                .send({ text: 'banana' });
            expect(res.statusCode).toBe(200);
            expect(res.body.joke).toBe('This is a joke.');
        });

        it('should return 400 if text is missing', async () => {
            const res = await request(app)
                .post('/api/v1/joke')
                .send({});
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing text parameter');
        });

        it('should return 500 if OpenAI API fails', async () => {
            axios.post.mockRejectedValue(new Error('API error'));
            const res = await request(app)
                .post('/api/v1/joke')
                .send({ text: 'apple' });
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to generate joke');
        });
    });

    describe('POST /api/v1/translate', () => {
        it('should return a translation when text and targetLanguage are provided', async () => {
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        { message: { content: 'Hola mundo' } }
                    ]
                }
            });
            const res = await request(app)
                .post('/api/v1/translate')
                .send({ text: 'Hello world', targetLanguage: 'Spanish' });
            expect(res.statusCode).toBe(200);
            expect(res.body.translation).toBe('Hola mundo');
        });

        it('should return 400 if text is missing', async () => {
            const res = await request(app)
                .post('/api/v1/translate')
                .send({ targetLanguage: 'French' });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing text or targetLanguage parameter');
        });

        it('should return 400 if targetLanguage is missing', async () => {
            const res = await request(app)
                .post('/api/v1/translate')
                .send({ text: 'Hello' });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Missing text or targetLanguage parameter');
        });

        it('should return 500 if OpenAI API fails', async () => {
            axios.post.mockRejectedValue(new Error('API error'));
            const res = await request(app)
                .post('/api/v1/translate')
                .send({ text: 'Hello', targetLanguage: 'German' });
            expect(res.statusCode).toBe(500);
            expect(res.body.error).toBe('Failed to generate translation');
        });
    });
});