import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('bep20_token')
export class Bep20Token {
  @PrimaryColumn('bigint', { name: 'id', nullable: false })
  public id: number;

  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @PrimaryColumn({ name: 'contract_type', nullable: false })
  public contractType: string;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

  @Column({ name: 'decimal', nullable: false })
  public decimal: number;

  @Column({ name: 'network', nullable: false })
  public network: string;

  @Column({ name: 'abi_key', nullable: false })
  public abiKey: string;

  @Column({ name: 'events', nullable: false })
  public events: string;
}
