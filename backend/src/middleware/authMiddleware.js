import jwt from 'jsonwebtoken';

const authMiddleware = (req,res,next) =>{
    //the request will contain the users token in the header as "Authorization"
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error:'No token provided'})
    }
    const token = authHeader.split(' ')[1];
    if(!token){
        return res.status(401).json({error:'No token provided'})
    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        req.userId = decoded.userId
        next();
    }catch(err){
        return res.status(401).json({error:'Invalid token'})
    }





};

export default authMiddleware;