const express = require('express')
const app = express()
const cors = require('cors')
const knex = require('knex')
const connection = require('./knexfile.js').development
const jwt = require('jsonwebtoken')
const database = knex(connection)
const bcrypt = require('bcrypt')
const { response } = require('express')

app.use(cors())
app.use(express.json())

const port = 9000

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

    // app.get('/users', (request, response) => {
    //     database('user')
    //         .select()
    //         .returning('*')
    //         .then(users => {
    //             response.json({users})
    //         }).catch(error => {
    //             console.error({error: error.message})
    //         })

    // })

    app.get('/users/:id', (request, response) => {
        database('user')
            .select()
            .where({id: request.params.id})
            .first()
            .then(user => {
                response.json({user})
            })
    })
    

    // app.patch('/users/:id', (request, response) => {
    //     const user = request.body
    //     database('user')
    //         .where({id: request.params.id})
    //         .update(user)
    //         .then(user => {
    //             response.json({user})
    //         })
    // })

    // app.delete('/users/:id', (request, response) => {
    //     const id = request.params.retrievedUser
    //     database('user')
    //         .where({id: id})
    //         .delete()
    //         .then(() => {
    //             response.json({message: `user with id ${id} is deleted`})
    //         }).catch(error => {
    //             console.error({error: error.message})
    //         })
    // })

    // app.post('/users', (request, resonse) => {
    //     const user = request.body
    //     database('user')
    //         .insert(user)
    //         .returning('*')
    //         .then(user => {
    //             response.json({user})
    //         }).catch(error => {
    //             console.error({error: error.message})
    //             response.sendStatus(500)
    //         })
    // })
  

app.listen(port, () => {
    console.log(`listening to port ${port}`)
})