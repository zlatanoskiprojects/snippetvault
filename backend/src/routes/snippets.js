import {Router} from 'express'
import pool from '../lib/db.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

//GET api - get all snippets for a specific user id
router.get('/',authMiddleware,async(req,res)=>{

    try {
        const userId = req.userId;
        const [snippets] = await pool.query('SELECT * FROM snippet WHERE user_id = ?',[userId]);
        return res.status(200).json(snippets);
    }catch(error){
        console.log("Error fetching snippets:",error);
        return res.status(500).json({error:'Internal server error'})
    }

})
//get a single snippet by id
router.get('/:id',authMiddleware,async(req,res)=>{
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

router.post('/',authMiddleware,async(req,res)=>{
    const {title,description,code,language,visibility,collection_id} = req.body;

    if(!title || !code || !language){
        return res.status(400).json({error:'Title, code and language are required'})
    }

    try{
        const [result] = await pool.query('INSERT INTO snippet (user_id,title,description,code,language,visibility,collection_id) VALUES (?,?,?,?,?,?,?)',[
            req.userId,
            collection_id || null,
            title,
            description || null,
            code,
            language,
            visibility || "private"
        ])
        //we send to frontend the id of the newly created snippet.  THIS HAS TO BE ADDRESSED AND BETTER HANDLED, MAYBE SENT ALL INFO ABOUT THE NEW SNIPPET BACK TO FRONTEND SO IT CAN DISPLAY IT.
        return res.status(201).json({id:result.insertId,message:'Snippet created successfully'})
    }catch(error){
        console.log("Error creating snippet",error);
        return res.status(500).json({error:'Internal server error'})
    }
});

//delete a snippet
router.delete('/:id',authMiddleware,async(req,res)=>{

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

router.put('/:id',authMiddleware,async(req,res)=>{
    const {title,description,code,language,visibility,collection_id} = req.body;

    if(!title || !code || !language){
        return res.status(400).json({error:'Title, code and language are required'})
    }

    try{
        const [result] = await pool.query('UPDATE snippet SET title = ?, description = ?, code = ?, language = ?, visibility = ?, collection_id = ? WHERE id = ? AND user_id = ?',[title,description,code,language,visibility,collection_id || null,req.params.id,req.userId]);
        if(result.affectedRows === 0){
            return res.status(404).json({error:'Snippet not found'})
        }
        return res.status(200).json({message:'Snippet updated successfully'})

    }catch(error){
        console.log("Error updating snippet",error);
        return res.status(500).json({error:'Internal server error'})
    }

})