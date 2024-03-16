import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class EnvConfigSchema1644571517000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: 'env_config',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'value',
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
    await queryRunner.dropTable('env_config');
  }
}
