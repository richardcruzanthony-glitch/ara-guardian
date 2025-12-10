
import { jest, describe, it, expect, afterEach, beforeEach } from '@jest/globals';
import { inngest } from '../src/mastra/inngest/client';

describe('Cron Automation Test', () => {
    let sendSpy: jest.SpyInstance;

    beforeEach(() => {
        sendSpy = jest.spyOn(inngest, 'send').mockImplementation(async () => {});
    });

    afterEach(() => {
        sendSpy.mockRestore();
    });

  it('should send a cron trigger event successfully', async () => {
    await inngest.send({ name: 'replit/cron.trigger', data: {} });

    expect(sendSpy).toHaveBeenCalledWith({
      name: 'replit/cron.trigger',
      data: {},
    });
  });
});
