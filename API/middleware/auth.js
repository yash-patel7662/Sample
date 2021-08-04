const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const db = require('../server')
const userColl = db.collection('user')
const { ObjectID } = require('mongodb');
const resPattern = require('../helpers/resPattern');

dotenv.config();

// verify JWT token and protect routes.
const protect = async (req, res, next) => {
    let token;
    let message = 'Not authorized to access this route.';
    let msg = 'The user belonging to this token does not exist.';
    // check header for authorization
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            token = req.headers.authorization;
        }
    }

    // check token
    if (!token) {
        // return next(new APIError(message, httpStatus.UNAUTHORIZED, true));
        let obj = resPattern.successPattern(httpStatus.UNAUTHORIZED, message);
        return res.status(obj.code).json(obj);
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // const user = await User.findById(decoded.id);
        const decodeId = { _id: ObjectID(decoded._id) }
        const user = await userColl.findOne(decodeId);

        if (user) {
            req.user = user;
            next();
        } else {
            return next(new APIError(msg, httpStatus.UNAUTHORIZED, true));
        }
    } catch (e) {
        return next(new APIError(message, httpStatus.UNAUTHORIZED, true));
    }
}

module.exports = {
    protect
}