import {Router} from 'express'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../lib/db.js';

const router = Router();

router.post('/register',async(req,res)=>{
const {username,email,password} = req.body;

const cleanUsername = username?.trim();
const cleanEmail = email?.trim();
const cleanPassword = password?.trim();

if(!cleanUsername || !cleanEmail || !cleanPassword){
    return res.status(400).json({error:'All fields are required'})
}


try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?',[cleanEmail]);
    if (existingUser.length > 0) {
        return res.status(400).json({error:'User with this email already exists'})
    }
    const hashedPassword = await bcrypt.hash(cleanPassword,10); //hashing the passowrd with bcrypt using salt of 10 rounds before entering into DB 
    await pool.query('INSERT INTO users (username,email,password_hash) VALUES (?,?,?)',[cleanUsername,cleanEmail,hashedPassword]);

    return res.status(201).json({message:'User registered successfully'})

} 


catch (error) {
    console.error('Error occurred while checking user:', error);
    return res.status(500).json({error:'Internal server error'})
}

});
