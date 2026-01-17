const { validateObjectId } = require('../utils/validation');

// Middleware to validate ObjectId parameter
const validateObjectIdParam = (req, res, next) => {
  const id = req.params.id;
  
  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }
  
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  next();
};

module.exports = validateObjectIdParam;
