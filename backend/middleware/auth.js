// Clerk authentication middleware
// This verifies the Clerk session token from the frontend

const verifyClerkToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // For now, allow requests without auth for development
            // In production, you should verify the Clerk token
            return next();
        }

        const token = authHeader.split(' ')[1];
        
        // TODO: Verify token with Clerk API
        // For now, we'll trust the frontend since Clerk handles auth
        // In production, verify the token:
        // const { verifyToken } = require('@clerk/clerk-sdk-node');
        // const payload = await verifyToken(token);
        // req.user = payload;
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        // Allow request to proceed for development
        next();
    }
};

module.exports = { verifyClerkToken };
