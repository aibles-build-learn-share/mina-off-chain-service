import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('job_status')
export class JobStatus {
  @PrimaryGeneratedColumn({ name: 'id' })
  public id: number;

  @Column({ name: 'status', default: 'waiting' })
  public status: string;

  @Column({ name: 'contract_address', nullable: false })
  public contractAddress: string;

  @Column({ name: 'transaction', nullable: false })
  public transaction: string;

  @Column({ name: 'data', nullable: false })
  public data: string;

  @Column({ name: 'chain_name', nullable: false })
  public chainName: string;
}
