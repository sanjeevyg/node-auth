
exports.up = async knex => {
    await  knex.schema.createTable('user', (table) => {
        table.increments()
        table.string('username')
        table.password('password_hash')
    } )
};

exports.down = async knex => {  
    await knex.schema.dropTableIfExists('user')
};
