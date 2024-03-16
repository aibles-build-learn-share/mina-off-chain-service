import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class JobStatusSchema1644571519000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'job_status',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '190',
          },
          {
            name: 'contract_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'transaction',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'data',
            type: 'longtext',
            isNullable: false,
          },
          {
            name: 'chain_name',
            type: 'varchar',
            length: '20'
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('job_status');
  }
}
