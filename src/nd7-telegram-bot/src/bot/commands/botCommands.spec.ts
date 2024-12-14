import { Telegraf } from 'telegraf';
import { setBotCommands } from './botCommands';

describe('Bot Command Handlers', () => {
    let bot: Telegraf;

    beforeEach(() => {
        bot = new Telegraf('dummy_token'); // Initialize the mocked bot
        jest.spyOn(bot, 'command'); // Spy on the mocked `command` method
        jest.spyOn(bot, 'on'); // Spy on `on`
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Clean up mocks after each test
    });

    it('should register the /version command', () => {
        setBotCommands(bot);

        expect(bot.command).toHaveBeenCalledWith(
            'version',
            expect.any(Function) // Ensure a callback function was registered
        );
    });

    it('should register the /prize command', () => {
        setBotCommands(bot);

        expect(bot.command).toHaveBeenCalledWith(
            'prize',
            expect.any(Function) // Ensure a callback function was registered
        );
    });

    it('should respond to /version with correct version message', () => {
        setBotCommands(bot);

        // Mock context for the command callback
        const mockReply = jest.fn();
        const mockContext = { reply: mockReply } as unknown as Parameters<Telegraf['command']>[1];

        // Call the `version` handler manually
        const versionHandler = (bot.command as jest.Mock).mock.calls.find(
            ([commandName]) => commandName === 'version'
        )[1]; // Callback function for `/version`
        versionHandler(mockContext);

        expect(mockReply).toHaveBeenCalledWith('👨‍💻🤓💾     v1.0.44');
    });
});