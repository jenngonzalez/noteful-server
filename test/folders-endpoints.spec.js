const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray } = require('./folders.fixtures')

describe('Folders Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders RESTART IDENTITY CASCADE'))

    describe(`GET /api/folders`, () => {
        context('Given no folders', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert test folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 200 and all of the folders', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })

        context('Given an XSS attack folder', () => {

        })

    })

    describe(`GET /api/folders/:folder_id`, () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderId = 12345
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })
        })

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId -1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })

        context('Given an XSS attack folder', () => {

        })
    })

    describe(`POST /api/folders`, () => {
        it('creates a folder, responding with 201 and the new folder', () => {
            const newFolder = {
                name: 'Test new folder'
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newFolder.name)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
                })
                .then(postRes => {
                    return supertest(app)
                        .get(`/api/folders/${postRes.body.id}`)
                        .expect(postRes.body)
                })

        })

        it(`responds with 400 and an error message when the 'name' field is missing`, () => {
            const newFolder = {
                name: ''
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(400, {
                    error: { message: `Missing 'name' in request body`}
                })
        })

        it(`removes XSS attack content from response`, () => {

        })
    })

    describe(`DELETE /api/folders/:folder_id`, () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderId = 54321
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } }
                    )
            })
        })

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it(`responds with 204 and removes the specified article`, () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/folders`)
                            .expect(expectedFolders)
                    })
            })
        })
    })
})