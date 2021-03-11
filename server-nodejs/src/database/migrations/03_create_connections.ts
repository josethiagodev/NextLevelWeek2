import knex from 'knex';

export async function up(knex: knex) {
    return knex.schema.createTable('connections', table => {
        table.increments('id').primary();

        // Relacionamento do Knex ('user_id' > users)
        table.integer('user_id')
            .notNullable()
            .references('id')
            .inTable('users')
            .onUpdate('CASCADE')
            .onDelete('CASCADE');
        
        // QUando houve a conexão?
        table.timestamp('created_at')
            .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
            .notNullable();
    });
}

export async function down(knex: knex) {
    return knex.schema.dropTable('connections');
}