const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_bills';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`Local MongoDB connection failed (${err.message}). Starting in-memory MongoDB fallback...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`In-memory MongoDB Connected successfully at: ${mongoUri}`);
    } catch (memErr) {
      console.error(`In-Memory MongoDB connection failed: ${memErr.message}`);
      process.exit(1);
    }
  }

  // Auto-seed if database is empty
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Empty database detected. Running initial auto-seed with 2 months of history across 42 agents...');
      const Agent = require('../models/Agent');
      const FoodBill = require('../models/FoodBill');
      const path = require('path');
      const fs = require('fs');
      
      const adminUser = new User({
        name: 'System Admin',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'ADMIN'
      });
      await adminUser.save();

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

      const uploadsDir = path.join(__dirname, '../uploads/screenshots');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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

        const u = new User({
          name: agent.name,
          email: agent.email,
          password: 'agent123',
          role: 'AGENT',
          agent: agent._id
        });
        await u.save();
        agentUsers.push(u);
      }

      console.log(`Auto-seeded ${savedAgents.length} agents into Agent Directory! Starts with 0 food bills (Clean Portal state).`);
    }
  } catch (seedErr) {
    console.error('Auto-seed error:', seedErr.message);
  }
};

module.exports = connectDB;
