import client from '../client'

export const getTerms = async () => {
    const res = await client.get('/api/term')
    return res.data
}

export const createTerm = async (payload) => {
    const res = await client.post('/api/term', payload)
    return res.data
}

export const deleteTerm = async (id) => {
    const res = await client.delete(`/api/term/${id}`)
    return res.data
}
