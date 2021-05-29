const express = require('express')
const app = express()
const cors = require('cors')
const knex = require('knex')
const connection = require('./knexfile.js').development
const database = knex(connection)
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

app.use(cors())
app.use(express.json())

const port = 3000

app.post('/users', (request, response) => {
    // const user = request.body
    // console.log(user)
    bcrypt.hash(request.body.password, 12, (error, hasedPassword) => {
        database('user')
            .insert({
                username: request.body.username,
                password_hash: hasedPassword
            })
            .returning('*')
            .then(user => {
                // const user = users[0]
                response.json({ user })
            }).catch(error => {
                console.error({error: error.message})
                response.sendStatus(500)
            })
    })})


app.listen(port, () => {
    console.log(`listening to port ${port}`)
})