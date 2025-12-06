const db = require('./db');
const bcrypt = require('bcrypt');

async function seedUsers() {
  return new Promise((resolve, reject) => {
    const database = db.getDb();
    
    database.serialize(async () => {
      try {
        // Check if users already exist
        database.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
          if (err) {
            console.error('Error checking users:', err);
            reject(err);
            return;
          }
          
          if (row.count > 0) {
            console.log('Users already exist, skipping seed');
            resolve();
            return;
          }
          
          // Create default users
          const defaultPassword = 'pass123';
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          
          // Create admin user
          database.run(
            'INSERT INTO users (username, password_hash, is_admin, display_order) VALUES (?, ?, ?, ?)',
            ['admin', passwordHash, 1, 1],
            function(err) {
              if (err) {
                console.error('Error creating admin user:', err);
                reject(err);
                return;
              }
              console.log('Admin user created (username: admin, password: pass123)');
              
              // Create FO user
              database.run(
                'INSERT INTO users (username, password_hash, is_admin, display_order) VALUES (?, ?, ?, ?)',
                ['FO', passwordHash, 0, 2],
                function(err) {
                  if (err) {
                    console.error('Error creating FO user:', err);
                    reject(err);
                    return;
                  }
                  console.log('FO user created (username: FO, password: pass123)');
                  resolve();
                }
              );
            }
          );
        });
      } catch (error) {
        console.error('Seed error:', error);
        reject(error);
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('User seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('User seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedUsers;

