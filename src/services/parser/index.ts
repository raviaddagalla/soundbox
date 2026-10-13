import { RawNotificationPayload } from '../../types/event';
import { AppNotificationParser, NotificationParseResult } from './types';
import { PhonePeParser } from './phonepe';
import { GooglePayParser } from './gpay';
import { PaytmParser } from './paytm';
import { BhimParser } from './bhim';
import { GenericUpiParser } from './generic';

export class NotificationParserRegistry {
  private parsers: AppNotificationParser[] = [
    new PhonePeParser(),
    new GooglePayParser(),
    new PaytmParser(),
    new BhimParser(),
    new GenericUpiParser(), // Fallback
  ];

  public getParserForPackage(packageName: string): AppNotificationParser {
    const found = this.parsers.find(p => p.canHandle(packageName));
    return found || this.parsers[this.parsers.length - 1];
  }

  public parse(notification: RawNotificationPayload): {
    parserName: string;
    result: NotificationParseResult;
  } {
    const parser = this.getParserForPackage(notification.packageName);
    const result = parser.parse(notification);
    return {
      parserName: parser.appName,
      result
    };
  }
}

export const parserRegistry = new NotificationParserRegistry();
