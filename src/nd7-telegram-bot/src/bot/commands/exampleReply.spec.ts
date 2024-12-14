import { exampleReply } from './botCommands';

describe('exampleReply', () => {
    it('should return a random "secret phrase" for valid input', () => {
        const response = exampleReply('prize', 'user123');

        const secretPhrases = [
            'indeed it was there whence thine tabletops were laid bare',
            'not that it was much of a thing worth noting',
            "it wasn't so much found as fleetingly borrowed..",
        ];

        expect(secretPhrases).toContain(response);
    });

    it('should return fallback red panda phrases for empty input', () => {
        const response = exampleReply('', '');

        const pandaPhrases = ['Red pandas are the best!', 'Red pandas are adorable!'];
        expect(pandaPhrases).toContain(response);
    });
});