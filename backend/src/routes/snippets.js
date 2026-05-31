import {Router} from 'express'
import pool from '../lib/db.js';
import authMiddleware from '../middleware/authMiddleware.js';
import {validationResult} from "express-validator";
import { snippetIdValidation, createSnippetValidation, updateSnippetValidation } from '../validators/snippets.js';

const router = Router()






//GET api - get all snippets for a specific user id
router.get('/',authMiddleware,async(req,res)=>{

    try {
        const userId = req.userId;
        const q = req.query.q;

        let snippets;

        if(q){
            const searchTerm =  `%${q}%`;
            [snippets] = await pool.query(
                'SELECT * FROM snippet WHERE user_id = ? AND (title LIKE ? OR language LIKE ?)',
                [userId, searchTerm, searchTerm]
            );
        }else{
            [snippets] = await pool.query('SELECT * FROM snippet WHERE user_id = ?',[userId]);

        }

        return res.status(200).json(snippets);
    }catch(error){
        console.log("Error fetching snippets:",error);
        return res.status(500).json({error:'Internal server error'})
    }

})
//get a single snippet by id
router.get('/:id',authMiddleware,snippetIdValidation,async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    try{
        //this query fetches in db the snippet with the specific id of that specific user_id
        const [rows] = await pool.query('SELECT * FROM snippet WHERE id = ? AND user_id = ?',[req.params.id,req.userId]);
        if(rows.length === 0){
            return res.status(404).json({error:'Snippet not found'})
        }
        return res.status(200).json(rows[0]);
    }catch(error){
        console.log("Error fetching snippet",error);
        return res.status(500).json({error:'Internal server error'})
    }

});

router.post('/',authMiddleware,createSnippetValidation,async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const {title,description,code,language,visibility,collection_id} = req.body;



    try{
        const [result] = await pool.query('INSERT INTO snippet (user_id,title,description,code,language,visibility,collection_id) VALUES (?,?,?,?,?,?,?)',[
            req.userId,
            title,
            description || null,
            code,
            language,
            visibility || "private",
            collection_id || null,

        ])
        const [rows] = await pool.query('SELECT * FROM snippet WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
    }catch(error){
        console.log("Error creating snippet",error);
        return res.status(500).json({error:'Internal server error'})
    }
});

//delete a snippet
router.delete('/:id',authMiddleware,snippetIdValidation,async(req   ,res)=>{
    const err = validationResult(req);
    if(!err.isEmpty()){
        return res.status(400).json({errors:err.array()})
    }
    try{

        const [result] = await pool.query('DELETE FROM snippet WHERE id = ? AND user_id = ?',[req.params.id,req.userId]); // params id is the one in the url that is to be deleted, other one is the yser that deletes it
        if(result.affectedRows === 0){
            return res.status(404).json({error:'Snippet not found'})
        }
        return res.status(200).json({message:'Snippet deleted successfully'})
    }catch(error){
        console.log("Error deleting snippet",error);
        return res.status(500).json({error:'Internal server error'})
    }
});

//update a snippet

router.patch('/:id', authMiddleware, updateSnippetValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // req.params.id and req.body values are already validated
    const snippetId = parseInt(req.params.id);

    const allowedFields = ['title', 'description', 'code', 'language', 'visibility', 'collection_id'];
    const updates = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    const keys = Object.keys(updates);
    const setClauses = keys.map(field => `${field} = ?`).join(', ');
    const values = [...keys.map(k => updates[k]), snippetId, req.userId];

    try {
        // collection_id ownership check — still manual, no library can do this
        if (updates.collection_id !== undefined && updates.collection_id !== null) {
            const [cols] = await pool.query(
                'SELECT id FROM collection WHERE id = ? AND user_id = ?',
                [updates.collection_id, req.userId]
            );
            if (cols.length === 0) {
                return res.status(403).json({ error: 'Collection not found or not yours' });
            }
        }

        const [result] = await pool.query(
            `UPDATE snippet SET ${setClauses} WHERE id = ? AND user_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }

        return res.status(200).json({ message: 'Snippet updated successfully' });

    } catch (error) {
        console.error('Error updating snippet:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;