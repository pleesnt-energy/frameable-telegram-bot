// Set NODE_ENV for Jest
process.env.NODE_ENV = 'test';

// Set up a mock Application Insights key (if your bot requires this)
process.env.APPINSIGHTS_INSTRUMENTATIONKEY = 'mock-key';

// (Optional) Mock any Azure-specific bindings if required
jest.mock('@azure/functions', () => {
    const mockHandler = jest.fn(); // Mock of handler execution
    const mockHttp = jest.fn((name, opts) => {
        if (opts.handler) {
            mockHandler.mockImplementation(async (context, request) => {
                // Call the real handler (`opts.handler`) and propagate its results
                return await opts.handler(context, request);
            });
        }
        return mockHandler;
    });

    return {
        app: {
            http: mockHttp,
        },
    };
});

jest.mock('telegraf', () => {
    return {
        Telegraf: jest.fn().mockImplementation(() => ({
            // Mock bot commands
            command: jest.fn(),
            on: jest.fn(), // Mock `on` method
            handleUpdate: jest.fn().mockResolvedValue(undefined), // Mock `handleUpdate`
            // Mock Telegram API behavior
            telegram: {
                setWebhook: jest.fn(), // Stub webhook registration
                callApi: jest.fn().mockResolvedValue({ result: 'mocked response' }), // Mock API calls
            },
        })),
    };
});