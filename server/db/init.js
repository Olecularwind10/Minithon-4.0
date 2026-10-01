import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function tableHasRows(tableName) {
  const row = db.prepare(`SELECT 1 FROM ${tableName} LIMIT 1`).get();
  return Boolean(row);
}

function seedCoreData() {
  const coreTables = ['users', 'help_requests', 'help_offers', 'matches'];
  const hasSeededData = coreTables.some((tableName) => tableHasRows(tableName));

  if (hasSeededData) {
    return;
  }

  const users = [
    {
      id: 'seed-user-1',
      name: 'Aarav Nair',
      email: 'aarav@powai.local',
      password_hash: bcrypt.hashSync('Password123!', 12),
      phone: '9876543210',
      profile_image: null,
      latitude: 19.1197,
      longitude: 72.905,
      area: 'Powai',
      skills: JSON.stringify(['Laptop repair', 'Wi-Fi setup', 'Home assistance']),
      availability: JSON.stringify(['weekends', 'evenings']),
      rating: 4.8,
      completed_requests: 12,
      email_verified: 1,
      phone_verified: 0,
      community_verified: 1,
      community_id: 'TSEC',
      verification_status: 'VERIFIED',
      status: 'active',
    },
    {
      id: 'seed-user-2',
      name: 'Meera Shah',
      email: 'meera@bandra.local',
      password_hash: bcrypt.hashSync('Password123!', 12),
      phone: '9123456780',
      profile_image: null,
      latitude: 19.0596,
      longitude: 72.8295,
      area: 'Bandra',
      skills: JSON.stringify(['Groceries', 'Delivery help', 'Moving assistance']),
      availability: JSON.stringify(['weekdays', 'afternoons']),
      rating: 4.5,
      completed_requests: 8,
      email_verified: 1,
      phone_verified: 0,
      community_verified: 0,
      community_id: null,
      verification_status: 'PENDING_VERIFICATION',
      status: 'active',
    },
  ];

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

  const requestCount = db.prepare('SELECT COUNT(*) AS count FROM help_requests').get().count;
  if (requestCount === 0) {
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
    ).run({
      id: 'seed-request-1',
      requester_id: 'seed-user-2',
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
      status: 'open',
      selected_helper_id: null,
    });
  }

  const offerCount = db.prepare('SELECT COUNT(*) AS count FROM help_offers').get().count;
  if (offerCount === 0) {
    db.prepare(
      `INSERT OR IGNORE INTO help_offers (
        id, user_id, category, skills, description, latitude, longitude, service_radius,
        availability, status, created_at, updated_at
      ) VALUES (
        @id, @user_id, @category, @skills, @description, @latitude, @longitude, @service_radius,
        @availability, @status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
    ).run({
      id: 'seed-offer-1',
      user_id: 'seed-user-1',
      category: 'errands',
      skills: JSON.stringify(['Groceries', 'Home assistance', 'Delivery help']),
      description: 'I can help with grocery pickup and home support in Powai and nearby areas.',
      latitude: 19.1197,
      longitude: 72.905,
      service_radius: 5,
      availability: JSON.stringify(['weekends', 'evenings']),
      status: 'active',
    });
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
    seedCoreData();
    console.log('SQLite schema initialized successfully.');
    return true;
  } catch (error) {
    console.warn('SQLite initialization failed. Continuing in dev-safe mode:', error.message);
    return false;
  }
}
