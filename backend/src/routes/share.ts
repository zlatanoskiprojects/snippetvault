import { Router, Request, Response } from 'express';
import db from '../lib/db';
import { asyncHandler } from '../middleware/errorHandler';
import { and, eq, sql } from 'drizzle-orm';
import { snippet,snippetTag,tag,users  } from '../db/schema';
import {shareTokenValidation} from '../validators/snippets'
import {validationResult} from 'express-validator'


const router = Router();

router.get('/:token',shareTokenValidation,asyncHandler(async (req:Request,res:Response)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    try{
        const rows = await db.select({
            id: snippet.id,
            title: snippet.title,
            description: snippet.description,
            code: snippet.code,
            language: snippet.language,
            createdAt: snippet.createdAt,
            updatedAt: snippet.updatedAt,
            tags: sql<string | null>`string_agg(${tag.name}, ',')`,
            ownerDisplayName: users.displayName,
            ownerUsername: users.username,
        }).from(snippet)
            .leftJoin(snippetTag, eq(snippetTag.snippetId, snippet.id))
            .leftJoin(tag, eq(tag.id, snippetTag.tagId))
            .innerJoin(users, eq(users.id, snippet.userId))
            .where(and(eq(snippet.shareToken, req.params.token as string), eq(snippet.visibility, 'public')))
            .groupBy(snippet.id, users.id);

        if(rows.length === 0){
            return res.status(404).json({error:'Snippet not found or not public'})
        }
        const s = rows[0];
        return res.status(200).json({
            id: s.id,
            title: s.title,
            description: s.description,
            code: s.code,
            language: s.language,
            tags: s.tags ? s.tags.split(',') : [],
            created_at: s.createdAt,
            updated_at: s.updatedAt,
            owner_name: s.ownerDisplayName ?? s.ownerUsername,
        });

    }catch(error){
        console.error("Error fetching SHARED snippet:", error);
        return res.status(500).json({error:'Internal server error'})
    }

}))

export default router;