import { Entity, BeforeInsert, BeforeUpdate, Column, PrimaryColumn } from 'typeorm';
import { Utils } from 'worker-common';

@Entity('currency_config')
export class CurrencyConfig {
  @PrimaryColumn({ name: 'chain', nullable: false })
  public chain: string;

  @Column({ name: 'network', nullable: false })
  public network: string;

  @Column({ name: 'chain_id', nullable: false })
  public chainId: string;

  @Column({ name: 'chain_name', nullable: false })
  public chainName: string;

  @Column({ name: 'average_block_time', nullable: false })
  public averageBlockTime: number;

  @Column('int', { name: 'block_time', nullable: false })
  public blockTime: number;

  @Column({ name: 'required_confirmations', nullable: false })
  public requiredConfirmations: number;

  @Column({ name: 'internal_endpoint', nullable: false })
  public internalEndpoint: string;

  @Column({ name: 'rpc_endpoint', nullable: false })
  public rpcEndpoint: string;

  @Column({ name: 'rpc_endpoint_backups', nullable: false })
  public rpcEndpointBackups: string;

  @Column({ name: 'queue_name', nullable: false })
  public queueName: string;

  @Column({ name: 'webhook_api', nullable: false })
  public webhookApi: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = Utils.nowInMillis();
    this.updatedAt = Utils.nowInMillis();
  }

  @BeforeUpdate()
  public updateUpdateDates() {
    this.updatedAt = Utils.nowInMillis();
  }
}
