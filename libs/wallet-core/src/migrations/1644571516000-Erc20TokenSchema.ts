import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Erc20TokenSchema1644571516000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'erc20_token',
        columns: [
          {
            name: 'contract_address',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'decimal',
            type: 'tinyint',
            width: 3,
            unsigned: true,
            isNullable: false,
          },
          {
            name: 'total_supply',
            type: 'decimal',
            isNullable: false,
            precision: 40,
            scale: 8,
            unsigned: true,
            default: 0,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'abi_key',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'events',
            type: 'longtext',
            isNullable: false,
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
    await queryRunner.dropTable('erc20_token');
  }
}
