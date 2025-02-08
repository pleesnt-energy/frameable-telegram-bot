import { app, InvocationContext } from "@azure/functions";

export async function onTokenIssued(queueItem: unknown, context: InvocationContext): Promise<void> {
    context.log('Storage queue function processed work item:', queueItem);
}

app.storageQueue('onTokenIssued', {
    queueName: 'js-queue-items',
    connection: '980d71_STORAGE',
    handler: onTokenIssued
});
