import { Instructor } from '../models/Instructor.js';
import bcrypt from 'bcryptjs';

// =============================================================================
//  INSTRUCTOR PORTAL CONTROLLER  —  ⚠️ INTENTIONALLY VULNERABLE (security lab)
// =============================================================================
//
// Unlike the review/auth controllers in this project, these handlers do NOT
// validate input with Joi and the app has NO express-mongo-sanitize. They pass
// `req.body` / `req.query` straight into Mongoose. Because Express parses JSON
// bodies and bracket-notation query strings into nested objects, an attacker
// can smuggle MongoDB query operators ($ne, $gt, $regex, $where, ...) into
// what the code treats as plain strings.
//
// This is the bug students must find and fix. Do not "clean this up".
// =============================================================================

function publicProfile(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    username: doc.username,
    department: doc.department,
    role: doc.role
  };
}

// POST /api/instructors/login
export async function loginInstructor(req, res, next) {
  try {
    const { username, password } = req.body ?? {};

    // Validate input
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Invalid input'
      });
    }

    // Find instructor by username
    const instructor = await Instructor.findOne({
      username: username.trim()
    });

    if (!instructor) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(
      password,
      instructor.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    return res.json({
      instructor: publicProfile(instructor)
    });

  } catch (err) {
    next(err);
  }
}

// GET /api/instructors
// Public directory. Deliberately limited fields so the contrast with the
// leaky /search endpoint below is obvious.
export async function getDirectory(req, res, next) {
  try {
    const instructors = await Instructor.find()
      .select('name department role')
      .sort({ name: 1 })
      .lean();
    res.json({ instructors });
  } catch (err) {
    next(err);
  }
}

// GET /api/instructors/search
// GET /api/instructors/search
export async function searchInstructors(req, res, next) {
  try {
    // Only allow the name parameter
    const allowedParams = ['name'];

    const unexpectedParams = Object.keys(req.query)
      .filter(key => !allowedParams.includes(key));

    

    const filter = {};

    if (req.query.name !== undefined) {
      if (
        typeof req.query.name !== 'string' ||
        req.query.name.length > 80
      ) {
        return res.status(400).json({
          message: 'Invalid name parameter'
        });
      }

      // Escape special regex characters
      const safeName = req.query.name.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      filter.name = {
        $regex: safeName,
        $options: 'i'
      };
    }

    const instructors = await Instructor.find(filter)
      .select('name department role')
      .sort({ name: 1 })
      .limit(50)
      .lean();

    return res.json({
      count: instructors.length,
      instructors
    });

  } catch (err) {
    next(err);
  }
}
