


**README: Testing Guidelines for the `nd7-telegram-bot` Project**

This section serves as a dedicated reference for developers working on tests for the **`nd7-telegram-bot`** project. It covers key information about the testing strategy, mocking Telegraf and Azure Functions, and best practices for writing robust tests.

---

# **Testing in the `nd7-telegram-bot` Project**

The **`nd7-telegram-bot`** project is thoroughly unit tested to ensure that bot logic, handler functions, and dependencies are robust and maintainable. Developers writing or extending tests can use this guide to understand the test structure and retain institutional knowledge.

---

**Testing Strategy**

This project uses:

- **Jest** as the testing framework
- **Mocking** to simulate Telegraf bot behavior, Telegram API interactions, and Azure Functions runtime
- **Unit Testing** for individual bot commands and handlers
- **Mock-Based Isolation** to prevent dependency on external services (e.g., Telegram’s servers)

Tests are stored alongside the feature files in **`src`**, with filenames following the pattern:

```
*.spec.ts
```

For example:

- Command-specific tests: **`src/bot/commands/botCommands.spec.ts`**
- Webhook handler tests: **`src/bot/index.spec.ts`**

---

**Key Concepts for Testing**

**1. Mocking Telegraf**

The **`Telegraf`** library is fully mocked in tests to isolate your bot’s logic from any external dependencies like Telegram’s servers.

The mock is defined using Jest and includes frequently used methods such as **`command`**, **`on`**, **`handleUpdate`**, and **`telegram.callApi`**.

```tsx

jest.mock('telegraf', () => {
    return {
        Telegraf: jest.fn().mockImplementation(() => ({
            command: jest.fn(), // Simulates bot.command('/command')
            on: jest.fn(), // Simulates bot.on(event, callback)
            handleUpdate: jest.fn().mockResolvedValue(undefined), // Pretends to handle updates
            telegram: {
                setWebhook: jest.fn(), // Stubs webhook registration
                callApi: jest.fn().mockResolvedValue({ result: 'mocked response' }), // Mocks API calls
            },
        })),
    };
});
```

### **Why This Matters**

Without this mock, **`telegraf`** would attempt to make real API calls to Telegram’s servers, causing tests to fail. Mocking also allows us to simulate behavior for specific bot commands and events.

---

**2. Mocking Azure Functions Runtime**

The project uses Azure Functions v4 programming model. During tests, we mock the Azure Functions runtime setup, especially the **`InvocationContext`** object responsible for logging, request details, and identification.

Mock implementation for the **`InvocationContext`**:

```tsx

let context: InvocationContext;

beforeEach(() => {
    context = {
        invocationId: 'mock-invocation-id', // Example invocation ID
        log: jest.fn((...args) => console.log('[Mock Log]', ...args)),
        error: jest.fn((...args) => console.error('[Mock Error]', ...args)),
    } as unknown as InvocationContext;
});
```

Mocking ensures:

- No dependency on the real Azure Functions host.
- Logging (**`context.log`**) works for debugging during tests.

---

**3. Key Handlers Under Test**

Key parts of the bot tested include:

1. **Command Handlers**: Specify how the bot responds to different commands or interactions.
    - Example: **`/version`**, **`/prize`**, **`/start`**

```tsx
setBotCommands(bot);
expect(bot.command).toHaveBeenCalledWith('version', expect.any(Function));
```

1. **Event Handlers**: Specify how the bot reacts to callbacks like inline keyboards or message events.
    - Example: Handling a **`callbackQuery("data")`**

```tsx
setBotCommands(bot);
expect(bot.on).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
```

1. **Webhook Handlers**: Test how the **`telegramBotHandler`** processes HTTP requests.
    - Example: An incoming webhook POST request.

```tsx

const response = await telegramBotHandler(mockRequest, mockContext);
expect(response.status).toBe(200);
expect(response.body).toContain('Webhook update processed');
```

---

**Creating a New Test**

1. **Decide Test Scope**:
    - **Bot Commands:** If adding a new command (e.g., **`/hello`**), test how the command interacts with Telegraf’s API (**`bot.command`**).
    - **Webhook Behavior:** If updating webhook logic (e.g., **`telegramBotHandler`**), test how it handles different payloads.
    - **Functions or Helpers:** If adding helper utilities, isolate and unit-test those functions.
2. **Mock Dependencies**:
    - Ensure any external or asynchronous behavior (e.g., API calls) is mocked.
    - Use Jest’s **`jest.fn()`** to mock **`reply`**, **`context.log`**, or any bot response.
3. **Follow Testing Naming Convention**:
    - New commands: **`src/bot/commands/yourCommand.spec.ts`**
    - Webhook tests: **`src/bot/index.spec.ts`**
    - Helper functions: **`src/utils/yourHelper.spec.ts`**
4. **Write the Test**:
    - Example:
    
    ```tsx
    
    it('should register the /hello command', () => {
        setBotCommands(bot);
        expect(bot.command).toHaveBeenCalledWith('hello', expect.any(Function));
    });
    ```
    
5. **Run Tests**: Run all tests with:
    
    ```bash
    npm test
    ```
    

---

**Test Example: Adding a New Mocked Command**

If adding a new **`/hello`** command, here’s how the corresponding test would look:

**Command Logic (botCommands.ts):**

```tsx

bot.command('hello', async (ctx) => {
    await ctx.reply(`Hello, ${ctx.from.first_name || 'there'}!`);
});
```

**Test for Command Registration:**

```tsx

it('should register the /hello command', () => {
    setBotCommands(bot);
    expect(bot.command).toHaveBeenCalledWith('hello', expect.any(Function));
});
```

**Test for Command Execution:**

```tsx

it('should respond to /hello with correct message', () => {
    setBotCommands(bot);

    // Mock `reply` and context
    const mockReply = jest.fn();
    const mockContext = {
        from: { first_name: 'TestUser' },
        reply: mockReply,
    } as unknown as Parameters<Telegraf['command']>[1];

    // Invoke handler
    const helloHandler = (bot.command as jest.Mock).mock.calls.find(
        ([commandName]) => commandName === 'hello'
    )[1];
    helloHandler(mockContext);

    expect(mockReply).toHaveBeenCalledWith('Hello, TestUser!');
});
```

---

**Best Practices for Tests**

1. **Use Comprehensive Mocks**: Always mock external APIs and libraries. Isolate bot logic to make testing faster and more predictable.
2. **Validate Command Execution**: Register commands using **`bot.command`** and verify the correct callback is invoked with expected behavior.
3. **Readable Tests**: Use descriptive titles for your **`describe`** and **`it`** blocks.
4. **Debugging Logs During Tests**: Use **`jest.fn()`** to capture logs and verify critical moments during bot execution:
    
    ```tsx
    expect(context.log).toHaveBeenCalledWith('Processing Telegram webhook event...');
    ```
    
5. **Avoid External Dependency Failures**: Never allow real API calls or service dependencies in unit tests. Mock all such behavior.

---

**Resources for Further Help**

- Jest Documentation: [https://jestjs.io/docs/](https://jestjs.io/docs/)
- Telegraf Library: [https://telegraf.js.org/](https://telegraf.js.org/)
- Azure Functions Node.js Docs: [https://learn.microsoft.com/en-us/azure/azure-functions/](https://learn.microsoft.com/en-us/azure/azure-functions/)
