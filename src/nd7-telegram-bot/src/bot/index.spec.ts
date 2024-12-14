import { telegramBotHandler } from './index';
import { InvocationContext, HttpRequest } from '@azure/functions'; // Use InvocationContext type
import { HttpResponseInit } from '@azure/functions';

process.env.BOT_TOKEN = 'dummy_test_bot_token';

describe('Telegram Bot Webhook Handler (with mocked Azure runtime)', () => {
    let context: InvocationContext;

    beforeEach(() => {
        // Mock context object
        context = {
            invocationId: 'mock-invocation-id',
            log: jest.fn((...args) => {
                console.log('[Mock Log]', ...args);
            }),
            error: jest.fn((...args) => {
                console.error('[Mock Error]', ...args);
            }),
        } as unknown as InvocationContext;
    });

    function createMockHttpRequest(body: any, method = 'POST'): HttpRequest {
        return {
            method,
            url: 'http://localhost:7071/api/test',
            headers: {},
            query: {},
            params: {},
            body,
        } as unknown as HttpRequest;
    }

    it('should process a valid Telegram update via mock runtime', async () => {
        const request = createMockHttpRequest({
            update_id: 1,
            message: {
                text: '/start',
                chat: { id: 12345 },
                from: { id: 67890, first_name: 'TestUser', is_bot: false },
            },
        });

        const response: HttpResponseInit = await telegramBotHandler(request, context);

        // Assert HTTP response
        expect(response.status).toBe(200);
        expect(response.body).toContain('Webhook update processed');

        // Expect logging in context
        expect(context.log).toHaveBeenCalledWith('Received an HTTP request');
        expect(context.log).toHaveBeenCalledWith('Processing Telegram webhook event...');
    });

    it('should handle invalid Telegram update (return 400)', async () => {
        const request = createMockHttpRequest(null); // Invalid request payload

        const response: HttpResponseInit = await telegramBotHandler(request, context);

        // Assert HTTP response
        expect(response.status).toBe(400);
        expect(response.body).toContain('Invalid request body');
        expect(context.log).toHaveBeenCalledWith('Received an HTTP request');
    });
});