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


    app.post('/login', (request, response) => {
        const user  = request.body
        database("user")
            .where({ username: user.username })
            .first()
            .then((retrievedUser) => {
                if (!retrievedUser) throw new Error('No user found!')

                return Promise.all([
                    bcrypt.compare(user.password, retrievedUser.password_hash),
                    Promise.resolve(retrievedUser)
                ])
                }).then(results => {
                    const arePasswordTheSame = results[0]
                    const user = results[1]

                    if(!arePasswordTheSame) throw new Error('Wrong password!')

                    const payload = {username: user.username}
                    const secret = 'SECRET!' 
                    //process.env.SECRET

                    jwt.sign(payload, secret, (error, token) => {
                        if(error) throw new Error('Sign in error!')
                        
                        response.json({token})
                    })
                }).catch(error => {
                    response.json(error.message)
            })
    })

    app.get('/authenticate', authenticate, (request, response) => {
        response.json({message: `${request.user.username} found me lucky-charm!`})
    })

    function authenticate(request, response, next) {
        const authHeader = request.get('Authorization')
        const token = authHeader.split(" ")[1]

        const secret = "SECRET!"

        jwt.verify(token, secret, (error, payload) => {
            if(error) response.json(error.message)
        
            database('user')
                .select()
                .where({username: payload.username})
                .first()
                .then(user => {
                    request.user = user 
                    next()
                }).catch(error => {
                    response.json({error: error.message})
        })
        })
    }





app.listen(port, () => {
    console.log(`listening to port ${port}`)
})