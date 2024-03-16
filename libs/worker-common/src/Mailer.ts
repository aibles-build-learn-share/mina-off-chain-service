import * as mailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { getLogger } from './Logger';
import { EnvConfigRegistry } from './registries/EnvConfigRegistry';

let instance: Mailer;
const logger = getLogger('MailerService');

export interface IMailerOptions {
  from?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  content: string;
  returnPath?: string;
  attachments?: Mail.Attachment[];
}

export class Mailer {
  public static getInstance(): Mailer {
    if (!instance) {
      instance = new Mailer();
    }
    return instance;
  }

  private from?: string;
  private options: any;
  private transporter: mailer.Transporter;

  constructor() {
    this.config();
  }

  public getOptions(): any {
    // authentication credentials should be hidden
    const options = {
      ...this.options,
      auth: {
        user: '**************',
        pass: '**************',
      },
    };
    return options;
  }

  public async sendMail(options: IMailerOptions): Promise<any> {
    const mailOptions: mailer.SendMailOptions = {
      headers: {
        'Return-Path': !!options.returnPath ? options.returnPath : '',
      },
      from: options.from || this.options.auth.user,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      envelope: {
        from: options.from || this.options.auth.user,
        to: options.to,
      },
      subject: options.subject,
      html: options.content,
      attachments: options.attachments,
    };
    if (!this.transporter) {
      throw new Error(
        `Mailer transpoter was not set, transporter=${this.transporter}. Please check your configure.`,
      );
    }
    const info = await this.transporter.sendMail(mailOptions);
    logger.info(`Message sent: ${info.messageId}`);
    logger.info(`Preview URL: ${mailer.getTestMessageUrl(info)}`);
    return info;
  }

  private config() {
    const host = EnvConfigRegistry.getCustomEnvConfig('MAIL_HOST')
      ? EnvConfigRegistry.getCustomEnvConfig('MAIL_HOST')
      : 'smtp.gmail.com';
    const port = !!EnvConfigRegistry.getCustomEnvConfig('MAIL_PORT')
      ? parseInt(EnvConfigRegistry.getCustomEnvConfig('MAIL_PORT'), 10)
      : 465;
    const user = EnvConfigRegistry.getCustomEnvConfig('MAIL_USERNAME');
    const password = EnvConfigRegistry.getCustomEnvConfig('MAIL_PASSWORD');
    if (!user || !password) {
      throw new Error(
        `Mailer could not setup with credentials: user=${user}, password=${password}`,
      );
    }
    this.options = {
      host,
      port,
      secure: port === 465 ? true : false,
      auth: {
        user,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
    };
    this.transporter = mailer.createTransport(this.options);
  }
}
