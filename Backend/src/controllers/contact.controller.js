const Contact = require('../models/contact.model');

const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      throw new Error('Name, email, subject and message are required');
    }

    const contact = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({ message: 'Feedback sent successfully', contact });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Feedback not found' });
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    const { status, reply } = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Feedback not found' });

    if (status) contact.status = status;
    if (reply) contact.reply = reply;
    if (reply && req.user) contact.repliedBy = req.user.id;

    await contact.save();
    res.json(contact);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Feedback not found' });
    await contact.remove();
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { createContact, getContacts, getContactById, updateContactStatus, deleteContact };
