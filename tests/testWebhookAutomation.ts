
import { jest, describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import { inngest } from '../src/mastra/inngest/client';

const PROVIDER = 'linear';
const mockWebhookPayload = {
  action: 'create',
  type: 'Issue',
  data: { id: 'mock-issue-999' },
};

describe('Webhook Automation Test', () => {
    let sendSpy: jest.SpyInstance;

    beforeEach(() => {
        sendSpy = jest.spyOn(inngest, 'send').mockImplementation(async () => {});
    });

    afterEach(() => {
        sendSpy.mockRestore();
    });

  it('should send a webhook trigger event successfully', async () => {
    const eventName = `event/api.webhooks.${PROVIDER}.action`;

    await inngest.send({
      name: eventName,
      data: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockWebhookPayload),
      },
    });

    expect(sendSpy).toHaveBeenCalledWith({
      name: eventName,
      data: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockWebhookPayload),
      },
    });
  });
});
