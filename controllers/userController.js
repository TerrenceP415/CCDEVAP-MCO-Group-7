const User = require('../models/User');

// GET: Render the admin management screen
exports.getAdminUsersPage = async (req, res) => {
    try {
        const rawUsers = await User.find().lean();
        
        // Maps your schema precisely to the variables expected by your layout template
        const users = rawUsers.map(user => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            passportNumber: user.passportNumber,
            role: user.role || 'passenger',
            status: 'Active'
        }));

        res.render('admin-users', { users, title: 'Admin Users', layout: 'admin' });
    } catch (err) {
        console.error("Dashboard Render Error:", err);
        res.status(500).send('Error loading the administration interface.');
    }
};

// POST: Add a new entry
exports.createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email address already registered.' });
        }

        const newUser = new User({
            name: name,
            email,
            password, // Automatically hashed by your pre-save hook
        });

        await newUser.save();
        res.status(201).json({ success: true, data: newUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT: Modify profile properties
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User reference not found.' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        
        // Only modify password if text was explicitly submitted from the reset form field
        if (password && password.trim() !== "") {
            user.password = password; // Will automatically flag isModified('password') for bcrypt
        }

        await user.save();
        res.json({ success: true, message: 'User record saved smoothly.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE: Permanent deletion processing
exports.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'Record target not found.' });
        }
        
        res.json({ success: true, message: 'User successfully removed from system.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};