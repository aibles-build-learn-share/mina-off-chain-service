import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Bep20TokenSchema1644571514000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'bep20_token',
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
            name: 'contract_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'contract_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: false,
          },
          {
            name: 'decimal',
            type: 'tinyint',
            width: 3,
            unsigned: true,
            isNullable: false,
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
    await queryRunner.dropTable('bep20_token');
  }
}
