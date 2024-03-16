import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class LatestBlockSchema1644571515000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'latest_block',
        columns: [
          {
            name: 'currency',
            type: 'varchar',
            length: '190',
            isPrimary: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'block_number',
            type: 'int',
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

    await queryRunner.createIndex(
      'latest_block',
      new TableIndex({
        name: 'IDX_TYPE',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'latest_block',
      new TableIndex({
        name: 'IDX_BLOCK_NUMBER',
        columnNames: ['block_number'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex('latest_block', 'IDX_TYPE');
    await queryRunner.dropIndex('latest_block', 'IDX_BLOCK_NUMBER');
    await queryRunner.dropTable('latest_block');
  }
}
