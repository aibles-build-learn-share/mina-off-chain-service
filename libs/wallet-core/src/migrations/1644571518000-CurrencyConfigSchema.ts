import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CurrencyConfigSchema1644571518000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'currency_config',
        columns: [
          {
            name: 'chain',
            type: 'varchar',
            length: '190',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'chain_id',
            type: 'varchar',
            length: '190',
            isNullable: true,
          },
          {
            name: 'chain_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'average_block_time',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'block_time',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'required_confirmations',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'internal_endpoint',
            type: 'varchar',
            length: '190',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'rpc_endpoint',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'rpc_endpoint_backups',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'queue_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'webhook_api',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable('currency_config');
  }
}
