import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('env_config')
export class EnvConfig {
  @PrimaryColumn({ name: 'key' })
  public key: string;

  @Column({ name: 'value' })
  public value: string;
}
