const Agent = require('../models/Agent');
const User = require('../models/User');

// Get agents
const getAgents = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') {
      filter.status = 'Active';
    }
    const agents = await Agent.find(filter).sort({ name: 1 });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
};

// Create new agent
const createAgent = async (req, res) => {
  try {
    const { name, team } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Agent Name is required.' });
    }

    const trimmedName = name.trim();
    const existingAgent = await Agent.findOne({ name: new RegExp(`^${trimmedName}$`, 'i') });

    if (existingAgent) {
      return res.status(400).json({ message: 'An agent with this name already exists.' });
    }

    const agentCount = await Agent.countDocuments();
    const employeeId = `FB${String(agentCount + 1).padStart(3, '0')}`;
    const cleanEmail = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;

    const agent = new Agent({
      name: trimmedName,
      employeeId,
      email: cleanEmail,
      team: team || 'Operations',
      status: 'Active'
    });

    await agent.save();

    res.status(201).json({ message: 'Agent added successfully', agent });
  } catch (error) {
    res.status(500).json({ message: 'Error creating agent', error: error.message });
  }
};

// Update agent
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, team, status } = req.body;

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    if (name) agent.name = name.trim();
    if (team) agent.team = team.trim();
    if (status) agent.status = status;

    await agent.save();
    res.json({ message: 'Agent updated successfully', agent });
  } catch (error) {
    res.status(500).json({ message: 'Error updating agent', error: error.message });
  }
};

// Delete agent
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    await Agent.findByIdAndDelete(id);
    await User.deleteMany({ agent: id });

    res.json({ message: `Agent ${agent.name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting agent', error: error.message });
  }
};

module.exports = {
  getAgents,
  createAgent,
  updateAgent,
  deleteAgent
};
