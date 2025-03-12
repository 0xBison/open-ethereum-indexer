import { Log } from '@ethersproject/abstract-provider';
import { Interface, LogDescription } from 'ethers/lib/utils';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config-module/config.service';
import { EventInfo } from 'modules/config-module';

export const EventParserIdentifier = 'EventParser';

@Injectable()
export class EventParser {
  constructor(private configService: ConfigService) {}

  private parseLogEvent(
    log: Log,
    contractInterface: Interface,
  ): LogDescription | null {
    // This try catch is very important as some errors are deferred by ethers until accessing
    // fields. See this issue: https://github.com/ethers-io/ethers.js/discussions/2735
    try {
      return contractInterface.parseLog(log);
    } catch {
      // TODO: Can add this back in but happens very frequently for ERC721 Transfers...
      // this.logger.error(`Failed parsing event log:\n${JSON.stringify(log)}`);
      return null;
    }
  }

  private getEventDetails(topicHash: string): EventInfo | null {
    return this.configService.getEventDetails(topicHash);
  }

  private checkAddressMatches(contractAddresses: string[], logAddress: string) {
    return this.configService.checkAddressMatches(
      contractAddresses,
      logAddress,
    );
  }

  public getParsedEvent(topicHash: string, log: Log) {
    const eventDetails = this.getEventDetails(topicHash);

    if (!eventDetails) {
      return null;
    }

    const { contractAddresses, eventFragment } = eventDetails;

    if (!this.checkAddressMatches(contractAddresses, log.address)) {
      return null;
    }

    // Create interface from the event fragment
    // We can create a minimal interface with just this event
    const contractInterface = new Interface([eventFragment]);

    // Parse the log event
    const parsedEvent = this.parseLogEvent(log, contractInterface);

    if (!parsedEvent) {
      return null;
    }

    return parsedEvent;
  }
}
