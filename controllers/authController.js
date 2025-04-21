const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
exports.signup = async (req, res) => {
    try {
        const { first_name, last_name, email, password, department_id, designation_id, manager_id } = req.body;
        const existingUser = await User.findUserByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
        await User.createUser(first_name, last_name, email, password, department_id, designation_id, manager_id);

        res.status(201).json({ message: 'User registered successfully', result: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const { first_name, last_name, id } = user;
        
        const role = await User.getRole(id);
        // console.log(role);
        // req.session.user = { first_name, last_name, email, role: "admin" };
        // return res.json({ message: "Login successful", user: req.session.user });

        const token = jwt.sign({ userId: user.id, role,first_name,last_name }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, message: "Login successful", first_name, last_name, email, role, status: 200 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.json({ message: "Logged out successfully" });
    });
};

exports.getDepartment = async (req, res) => {
    try {
        const department = await User.getDepartment();
        return res.status(200).json({ data: department });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDesignation = async (req, res) => {
    try {
        const designation = await User.getDesignation();
        return res.status(200).json({ data: designation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProject = async (req, res) => {
    try {
        const project = await User.getProject();
        return res.status(200).json({ data: project });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
exports.getManager = async (req, res) => {
    try {
        const manager = await User.getManager();
        return res.status(200).json({ data: manager });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}