import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function seedCoreData() {
  const mumbaiAreas = [
    { area: 'Powai', latitude: 19.1197, longitude: 72.905 },
    { area: 'Bandra', latitude: 19.0596, longitude: 72.8295 },
    { area: 'Andheri', latitude: 19.1136, longitude: 72.8697 },
    { area: 'Chembur', latitude: 19.0598, longitude: 72.8997 },
    { area: 'Worli', latitude: 19.0144, longitude: 72.8234 },
    { area: 'Dadar', latitude: 19.0183, longitude: 72.8426 },
    { area: 'Kurla', latitude: 19.0728, longitude: 72.8826 },
    { area: 'Ghatkopar', latitude: 19.0858, longitude: 72.9085 },
    { area: 'Malad', latitude: 19.1867, longitude: 72.8488 },
    { area: 'Colaba', latitude: 18.9060, longitude: 72.8144 },
  ];

  const nonMumbaiIndianAreas = [
    { area: 'Pune', latitude: 18.5204, longitude: 73.8567 },
    { area: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
    { area: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
    { area: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
    { area: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { area: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
    { area: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
    { area: 'Lucknow', latitude: 26.8467, longitude: 80.9462 },
  ];

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const requestCount = db.prepare('SELECT COUNT(*) AS count FROM help_requests').get().count;
  const offerCount = db.prepare('SELECT COUNT(*) AS count FROM help_offers').get().count;
  const conversationCount = db.prepare('SELECT COUNT(*) AS count FROM conversations').get().count;
  const notificationCount = db.prepare('SELECT COUNT(*) AS count FROM notifications').get().count;
  const ratingCount = db.prepare('SELECT COUNT(*) AS count FROM ratings').get().count;
  const activityCount = db.prepare('SELECT COUNT(*) AS count FROM community_activities').get().count;
  const reportCount = db.prepare('SELECT COUNT(*) AS count FROM reports').get().count;

  const fixNullLocations = () => {
    const rows = db.prepare('SELECT id, rowid FROM users WHERE area IS NULL OR latitude IS NULL OR longitude IS NULL ORDER BY rowid').all();
    rows.forEach((row, index) => {
      const meta = mumbaiAreas[index % mumbaiAreas.length];
      db.prepare('UPDATE users SET area = ?, latitude = ?, longitude = ? WHERE id = ?')
        .run(meta.area, meta.latitude, meta.longitude, row.id);
    });
  };

  fixNullLocations();

  if (userCount >= 60 && requestCount > 0 && offerCount > 0) {
    return;
  }

  const helperSkills = [
    ['Laptop repair', 'Wi‑Fi setup', 'Home assistance'],
    ['Groceries', 'Moving help', 'Delivery help'],
    ['Plumbing', 'Electrical work', 'Basic carpentry'],
    ['Vehicle pickup', 'Heavy lifting', 'Packing'],
    ['Tutoring', 'Exam prep', 'Computer basics'],
    ['Pet care', 'Baby sitting', 'Errands'],
  ];

  const seekerNeeds = [
    ['Groceries', 'Need grocery pickup'],
    ['Moving help', 'Need help moving furniture'],
    ['Laptop repair', 'Need a quick tech fix'],
    ['Tutoring', 'Need homework support'],
    ['Errands', 'Need a small local task'],
    ['Pet care', 'Need help with pet sitting'],
  ];

  const getLocationByRatio = (index, segmentSize) => {
    const isMumbai = index < Math.floor(segmentSize * 0.9);
    const areaList = isMumbai ? mumbaiAreas : nonMumbaiIndianAreas;
    return areaList[index % areaList.length];
  };

  const users = [];

  for (let i = 0; i < 60; i += 1) {
    const meta = getLocationByRatio(i, 60);
    const skillSet = helperSkills[i % helperSkills.length];
    const baseIndex = i + 1;

    users.push({
      id: `seed-helper-${baseIndex}`,
      name: `Helper ${baseIndex}`,
      email: `helper${baseIndex}@${meta.area.toLowerCase().replace(/\s+/g, '')}.local`,
      password_hash: bcrypt.hashSync('Password123!', 12),
      phone: `9${String(7000000000 + i).slice(0, 10)}`,
      profile_image: null,
      latitude: Number((meta.latitude + (i % 5) * 0.003).toFixed(4)),
      longitude: Number((meta.longitude + (i % 4) * 0.002).toFixed(4)),
      area: meta.area,
      skills: JSON.stringify(skillSet),
      availability: JSON.stringify(['weekends', 'evenings', 'weekdays']),
      rating: Number((3.8 + (i % 10) * 0.12).toFixed(1)),
      completed_requests: 4 + (i % 12),
      email_verified: 1,
      phone_verified: 0,
      community_verified: 1,
      community_id: 'TSEC',
      verification_status: 'VERIFIED',
      status: 'active',
    });
  }

  for (let i = 0; i < 40; i += 1) {
    const meta = getLocationByRatio(i, 40);
    const need = seekerNeeds[i % seekerNeeds.length];
    const baseIndex = i + 1;

    users.push({
      id: `seed-seeker-${baseIndex}`,
      name: `Seeker ${baseIndex}`,
      email: `seeker${baseIndex}@${meta.area.toLowerCase().replace(/\s+/g, '')}.local`,
      password_hash: bcrypt.hashSync('Password123!', 12),
      phone: `8${String(8000000000 + i).slice(0, 10)}`,
      profile_image: null,
      latitude: Number((meta.latitude - (i % 4) * 0.002).toFixed(4)),
      longitude: Number((meta.longitude + (i % 5) * 0.003).toFixed(4)),
      area: meta.area,
      skills: JSON.stringify([need[0]]),
      availability: JSON.stringify(['weekdays']),
      rating: 0,
      completed_requests: 0,
      email_verified: 1,
      phone_verified: 0,
      community_verified: 0,
      community_id: null,
      verification_status: 'PENDING_VERIFICATION',
      status: 'active',
    });
  }

  const organizerCount = 10;
  for (let i = 0; i < organizerCount; i += 1) {
    const meta = getLocationByRatio(i, 10);
    const baseIndex = i + 1;

    users.push({
      id: `seed-organizer-${baseIndex}`,
      name: `Organizer ${baseIndex}`,
      email: `organizer${baseIndex}@${meta.area.toLowerCase().replace(/\s+/g, '')}.local`,
      password_hash: bcrypt.hashSync('Password123!', 12),
      phone: `7${String(6000000000 + i).slice(0, 10)}`,
      profile_image: null,
      latitude: Number((meta.latitude + 0.004).toFixed(4)),
      longitude: Number((meta.longitude - 0.003).toFixed(4)),
      area: meta.area,
      skills: JSON.stringify(['Event coordination', 'Volunteer management', 'Community support']),
      availability: JSON.stringify(['weekends', 'evenings']),
      rating: 4.6,
      completed_requests: 8 + i,
      email_verified: 1,
      phone_verified: 0,
      community_verified: 1,
      community_id: 'TSEC',
      verification_status: 'VERIFIED',
      status: 'active',
    });
  }

  const existingUserCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (existingUserCount < 110) {
    const insertUser = db.prepare(
      `INSERT OR IGNORE INTO users (
        id, name, email, password_hash, phone, profile_image, latitude, longitude, area,
        skills, availability, rating, completed_requests, email_verified, phone_verified,
        community_verified, community_id, verification_status, status, created_at
      ) VALUES (
        @id, @name, @email, @password_hash, @phone, @profile_image, @latitude, @longitude, @area,
        @skills, @availability, @rating, @completed_requests, @email_verified, @phone_verified,
        @community_verified, @community_id, @verification_status, @status, CURRENT_TIMESTAMP
      )`,
    );

    for (const user of users) {
      insertUser.run(user);
    }
  }

  if (requestCount === 0) {
    const sampleRequest = {
      id: 'seed-request-1',
      requester_id: 'seed-seeker-1',
      title: 'Need help with grocery pickup',
      description: 'I need someone to pick up groceries from a nearby store and drop them home.',
      category: 'errands',
      latitude: 19.0596,
      longitude: 72.8295,
      area: 'Bandra',
      preferred_date: '2026-10-05',
      preferred_time: '18:00',
      urgency: 'medium',
      estimated_duration: 2,
      status: 'accepted',
      selected_helper_id: 'seed-helper-1',
    };

    db.prepare(
      `INSERT OR IGNORE INTO help_requests (
        id, requester_id, title, description, category, latitude, longitude, area,
        preferred_date, preferred_time, urgency, estimated_duration, status, selected_helper_id,
        created_at, updated_at
      ) VALUES (
        @id, @requester_id, @title, @description, @category, @latitude, @longitude, @area,
        @preferred_date, @preferred_time, @urgency, @estimated_duration, @status, @selected_helper_id,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
    ).run(sampleRequest);
  }

  if (offerCount === 0) {
    const sampleOffer = {
      id: 'seed-offer-1',
      user_id: 'seed-helper-1',
      category: 'errands',
      skills: JSON.stringify(['Groceries', 'Home assistance', 'Delivery help']),
      description: 'I can help with grocery pickup and home support in Powai and nearby areas.',
      latitude: 19.1197,
      longitude: 72.905,
      service_radius: 5,
      availability: JSON.stringify(['weekends', 'evenings']),
      status: 'active',
    };

    db.prepare(
      `INSERT OR IGNORE INTO help_offers (
        id, user_id, category, skills, description, latitude, longitude, service_radius,
        availability, status, created_at, updated_at
      ) VALUES (
        @id, @user_id, @category, @skills, @description, @latitude, @longitude, @service_radius,
        @availability, @status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
    ).run(sampleOffer);
  }

  if (conversationCount === 0) {
    const sampleConversation = {
      id: 'seed-conversation-1',
      request_id: 'seed-request-1',
      participant_a: 'seed-seeker-1',
      participant_b: 'seed-helper-1',
    };

    db.prepare(
      `INSERT OR IGNORE INTO conversations (
        id, request_id, participant_a, participant_b, created_at
      ) VALUES (
        @id, @request_id, @participant_a, @participant_b, CURRENT_TIMESTAMP
      )`,
    ).run(sampleConversation);

    const sampleMessages = [
      {
        id: 'seed-message-1',
        conversation_id: 'seed-conversation-1',
        sender_id: 'seed-seeker-1',
        content: 'Hi, can you help me with grocery pickup today?',
        read_status: 1,
      },
      {
        id: 'seed-message-2',
        conversation_id: 'seed-conversation-1',
        sender_id: 'seed-helper-1',
        content: 'Yes, I can help. I will be in Bandra shortly.',
        read_status: 0,
      },
    ];

    sampleMessages.forEach((message) => {
      db.prepare(
        `INSERT OR IGNORE INTO messages (
          id, conversation_id, sender_id, content, read_status, created_at
        ) VALUES (
          @id, @conversation_id, @sender_id, @content, @read_status, CURRENT_TIMESTAMP
        )`,
      ).run(message);
    });
  }

  if (notificationCount === 0) {
    db.prepare(
      `INSERT OR IGNORE INTO notifications (
        id, user_id, type, title, body, read_status, created_at
      ) VALUES (
        'seed-notification-1', 'seed-helper-1', 'request', 'New request match', 'A seeker nearby requested grocery pickup help.', 0, CURRENT_TIMESTAMP
      )`,
    ).run();
  }

  if (ratingCount === 0 && requestCount > 0) {
    db.prepare(
      `INSERT OR IGNORE INTO ratings (
        id, request_id, reviewer_id, reviewed_user_id, rating, comment, created_at
      ) VALUES (
        'seed-rating-1', 'seed-request-1', 'seed-seeker-1', 'seed-helper-1', 5, 'Very helpful and on time.', CURRENT_TIMESTAMP
      )`,
    ).run();

    const average = db.prepare('SELECT AVG(rating) AS average_rating FROM ratings WHERE reviewed_user_id = ?').get('seed-helper-1');
    db.prepare('UPDATE users SET rating = ? WHERE id = ?').run(Number(average.average_rating || 0), 'seed-helper-1');
  }

  if (activityCount === 0) {
    db.prepare(
      `INSERT OR IGNORE INTO community_activities (
        id, organizer_id, title, description, category, latitude, longitude, date, time,
        max_participants, status, created_at
      ) VALUES (
        'seed-activity-1', 'seed-organizer-1', 'Mumbai Neighbourhood Cleanup Drive',
        'Join volunteers for a local cleanup and community support activity in Powai.',
        'cleanup', 19.1197, 72.905, '2026-10-12', '10:00', 30, 'upcoming', CURRENT_TIMESTAMP
      )`,
    ).run();
  }

  if (reportCount === 0) {
    db.prepare(
      `INSERT OR IGNORE INTO reports (
        id, reporter_id, reported_user_id, report_type, message, status, created_at
      ) VALUES (
        'seed-report-1', 'seed-seeker-1', 'seed-helper-1', 'harassment', 'Reported for inappropriate communication during a request.', 'pending', CURRENT_TIMESTAMP
      )`,
    ).run();
  }
}

export async function initializeDatabase() {
  if (!db) {
    console.warn('SQLite database not available. Continuing in memory-safe mode.');
    return false;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('No schema.sql found for SQLite initialization.');
    return false;
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    db.exec(schemaSql);
    const userColumns = db.pragma('table_info(users)');
    if (!userColumns.some((column) => column.name === 'address')) {
      db.exec('ALTER TABLE users ADD COLUMN address TEXT');
    }
    seedCoreData();
    console.log('SQLite schema initialized successfully.');
    return true;
  } catch (error) {
    console.warn('SQLite initialization failed. Continuing in dev-safe mode:', error.message);
    return false;
  }
}
