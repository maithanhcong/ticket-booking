import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { RABBITMQ_CONSTANTS, BookingHoldMessage } from './rabbitmq.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;

  async onModuleInit(): Promise<void> {
    await this.connectAndInitializeTopology();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ connection successfully closed');
    } catch (error) {
      this.logger.error(`Error closing RabbitMQ connection: ${error.message}`);
    }
  }

  /**
   * Establishes connection, creates channel, and asserts exchanges, queues, and DLX bindings.
   */
  private async connectAndInitializeTopology(): Promise<void> {
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || 5672;
    const user = process.env.RABBITMQ_USER || 'ticket_mq_admin';
    const pass = process.env.RABBITMQ_PASSWORD || 'ticket_mq_password';
    const url = process.env.RABBITMQ_URL || `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.logger.log(`Connected to RabbitMQ at ${host}:${port}`);

      // 1. Declare the Dead-Letter Exchange (DLX)
      await this.channel.assertExchange(
        RABBITMQ_CONSTANTS.BOOKING_DLX_EXCHANGE,
        'direct',
        { durable: true },
      );

      // 2. Declare the DLX Release Queue where expired messages arrive
      await this.channel.assertQueue(
        RABBITMQ_CONSTANTS.BOOKING_RELEASE_QUEUE,
        { durable: true },
      );

      // 3. Bind the Release Queue to the DLX
      await this.channel.bindQueue(
        RABBITMQ_CONSTANTS.BOOKING_RELEASE_QUEUE,
        RABBITMQ_CONSTANTS.BOOKING_DLX_EXCHANGE,
        RABBITMQ_CONSTANTS.BOOKING_RELEASE_ROUTING_KEY,
      );

      // 4. Declare the Hold Exchange
      await this.channel.assertExchange(
        RABBITMQ_CONSTANTS.BOOKING_HOLD_EXCHANGE,
        'direct',
        { durable: true },
      );

      // 5. Declare the Hold Queue configured with DLX arguments
      // Any message unconsumed after its TTL expires will be automatically dropped into DLX
      await this.channel.assertQueue(
        RABBITMQ_CONSTANTS.BOOKING_HOLD_QUEUE,
        {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': RABBITMQ_CONSTANTS.BOOKING_DLX_EXCHANGE,
            'x-dead-letter-routing-key': RABBITMQ_CONSTANTS.BOOKING_RELEASE_ROUTING_KEY,
          },
        },
      );

      // 6. Bind the Hold Queue to the Hold Exchange
      await this.channel.bindQueue(
        RABBITMQ_CONSTANTS.BOOKING_HOLD_QUEUE,
        RABBITMQ_CONSTANTS.BOOKING_HOLD_EXCHANGE,
        RABBITMQ_CONSTANTS.BOOKING_HOLD_ROUTING_KEY,
      );

      this.logger.log('RabbitMQ Hold & DLX topologies successfully initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize RabbitMQ topology: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Publishes a seat reservation holding message with a 10-minute expiration TTL.
   */
  async publishBookingHold(
    message: BookingHoldMessage,
    ttlMs: number = RABBITMQ_CONSTANTS.HOLD_TTL_MS,
  ): Promise<boolean> {
    const payloadBuffer = Buffer.from(JSON.stringify(message));

    const published = this.channel.publish(
      RABBITMQ_CONSTANTS.BOOKING_HOLD_EXCHANGE,
      RABBITMQ_CONSTANTS.BOOKING_HOLD_ROUTING_KEY,
      payloadBuffer,
      {
        persistent: true,
        expiration: ttlMs.toString(), // Message will drop to DLX after ttlMs
        messageId: message.bookingId,
        timestamp: Date.now(),
        contentType: 'application/json',
      },
    );

    this.logger.log(
      `Published booking hold message for bookingId=${message.bookingId}, TTL=${ttlMs}ms`,
    );

    return published;
  }

  /**
   * Returns a dedicated channel for consumers.
   */
  async createConsumerChannel(): Promise<amqp.Channel> {
    return this.connection.createChannel();
  }
}
