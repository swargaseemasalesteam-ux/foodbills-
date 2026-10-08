const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Agent = require('../models/Agent');
const FoodBill = require('../models/FoodBill');
const { createSampleReceiptPNG } = require('../config/sampleReceiptHelper');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Agent.deleteMany({});
    await FoodBill.deleteMany({});

    const uploadsDir = path.join(__dirname, '../uploads/screenshots');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('Seeding Admin User...');
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'ADMIN'
    });
    await adminUser.save();

    console.log('Seeding All 42 Agents...');
    const rawAgentNames = [
      // Operations Team
      'Lahari', 'Deepthi', 'Likhitha', 'Bhargavi', 'Sri devi',
      'Iswarya', 'Raj kumari', 'Kaveri', 'Sravani', 'Varshini',
      'Rehana', 'Amulya', 'Rachana', 'Hema.V', 'Aparna',
      'Joyas', 'Charishma', 'Vinathi', 'Mitra', 'N.kavya',
      'Kumari', 'Teja', 'Sailaja', 'Sindhu', 'Madhavi',
      'Ranjitha', 'Suguna', 'Sravanthi', 'Lavanya', 'Swathi',
      'Hema Sri', 'Souparnika', 'UshaRani', 'Akanksha', 'Sukeetha',
      'Akhila', 'Khushi', 'Praveena', 'Paadha sri',
      // Reporting Team
      'Sangeetha', 'Nandhini', 'Satwika'
    ];

    const reportingTeamNames = ['Sangeetha', 'Nandhini', 'Satwika'];

    const savedAgents = [];
    const agentUsers = [];

    for (let i = 0; i < rawAgentNames.length; i++) {
      const name = rawAgentNames[i];
      const empId = `FB${String(i + 1).padStart(3, '0')}`;
      const isReporting = reportingTeamNames.includes(name);
      const team = isReporting ? 'Reporting Team' : 'Operations';
      const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`;

      const agent = new Agent({
        name,
        employeeId: empId,
        email,
        mobileNumber: `98765${String(10000 + i).slice(1)}`,
        team,
        status: 'Active'
      });
      await agent.save();
      savedAgents.push(agent);

      const user = new User({
        name: agent.name,
        email: agent.email,
        password: 'agent123',
        role: 'AGENT',
        agent: agent._id
      });
      await user.save();
      agentUsers.push(user);
    }

    console.log('================================================');
    console.log('DATABASE SEEDED FOR FRESH PORTAL STATE!');
    console.log(`Seeded ${savedAgents.length} agents into Agent Directory with 0 food bills.`);
    console.log('================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
