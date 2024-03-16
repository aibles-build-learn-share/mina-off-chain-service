import { Entity, BeforeInsert, BeforeUpdate, Column, PrimaryColumn } from 'typeorm';
import { Utils } from 'worker-common';

@Entity('currency')
export class Currency {
  @PrimaryColumn('bigint', { name: 'id', nullable: false })
  public id: number;

  @Column({ name: 'symbol', nullable: false })
  public symbol: string;

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
