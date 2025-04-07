const fs = require('fs');
const path = require('path');
const transfersFilePath = path.join(__dirname, 'transfers.json');
const backupFilePath = path.join(__dirname, 'transfers-backup.json');

try {
    // Read and parse transfers
    let transfers = JSON.parse(fs.readFileSync(transfersFilePath, 'utf8'));

    // Backup original
    fs.writeFileSync(backupFilePath, JSON.stringify(transfers, null, 2));
    console.log('✅ Backup created at:', backupFilePath);

    // Migrate data
    transfers = transfers.map((t) => {
        if (!t.date) {
            const timeMatch = t.timestamp.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1], 10);
                const minutes = parseInt(timeMatch[2], 10);
                const period = timeMatch[3].toUpperCase();
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;

                const today = new Date();
                today.setHours(hours, minutes, 0, 0);
                t.date = today.toISOString();
            } else {
                t.date = new Date().toISOString();
            }
        }

        if (!t.transactionId) {
            t.transactionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }

        return t;
    });

    // Sort by date (newest first)
    transfers.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Write updated transfers
    fs.writeFileSync(transfersFilePath, JSON.stringify(transfers, null, 2));
    console.log('✅ Migrated transfers saved:', transfers.length, 'records');
} catch (err) {
    console.error('❌ Migration failed:', err);
}















