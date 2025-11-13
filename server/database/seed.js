const db = require('./db');

const sampleLogs = [
  {
    log_date: new Date('2025-11-01T08:15:00').toISOString(),
    short_description: 'Guest complaint',
    note: 'Room 203 reported noise from construction. Offered room change, guest accepted. Moved to 405.',
    worker_name: 'MAR'
  },
  {
    log_date: new Date('2025-11-01T10:30:00').toISOString(),
    short_description: 'Maintenance issue',
    note: 'Elevator 2 stopped working. Technician called, ETA 14:00.',
    worker_name: 'JDO'
  },
  {
    log_date: new Date('2025-11-01T12:45:00').toISOString(),
    short_description: 'VIP arrival',
    note: 'Mr. Smith (VIP guest) checked in early. Given suite upgrade and welcome gift as per protocol.',
    worker_name: 'ANA'
  },
  {
    log_date: new Date('2025-11-01T15:20:00').toISOString(),
    short_description: 'Lost property',
    note: 'Guest left laptop charger in conference room B. Stored in lost & found, logged item #145.',
    worker_name: 'TOM'
  },
  {
    log_date: new Date('2025-11-01T18:00:00').toISOString(),
    short_description: 'Shift summary',
    note: 'Quiet evening shift. 12 check-ins, 8 check-outs. No issues. Restaurant fully booked for dinner.',
    worker_name: 'LIS'
  }
];

async function seed() {
  try {
    await db.initialize();
    const database = db.getDb();

    // Clear existing data (optional - comment out if you want to keep existing data)
    // database.run('DELETE FROM shift_logs', (err) => {
    //   if (err) console.error('Error clearing data:', err);
    // });

    console.log('Seeding sample data...');

    for (const log of sampleLogs) {
      database.run(
        `INSERT INTO shift_logs (log_date, short_description, note, worker_name) 
         VALUES (?, ?, ?, ?)`,
        [log.log_date, log.short_description, log.note, log.worker_name],
        function(err) {
          if (err) {
            console.error(`Error inserting log: ${log.short_description}`, err);
          } else {
            console.log(`✓ Inserted: ${log.short_description} (ID: ${this.lastID})`);
          }
        }
      );
    }

    // Wait a bit for inserts to complete
    setTimeout(() => {
      console.log('\nSample data seeded successfully!');
      db.close();
      process.exit(0);
    }, 1000);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

