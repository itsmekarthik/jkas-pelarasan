const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001; // Use env PORT for Azure

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('.'));

// Database configuration - same as kewangan
const dbConfig = {
    user: process.env.DB_USER || 'jkasadmin',
    password: process.env.DB_PASSWORD || 'P@ssw0rd',
    server: process.env.DB_SERVER || 'jkas-server.database.windows.net',
    database: process.env.DB_NAME || 'jkasdb',
    options: {
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};

// Connect to database
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to SQL Server database: JKAS (Pelarasan)');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
}

// Initialize database connection
connectDB();

// Health check endpoint for Azure monitoring
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: 'Pelarasan Module',
        port: port
    });
});

// API endpoint to save new pelarasan
app.post('/api/pelarasan/save', async (req, res) => {
    try {
        const {
            namaAlamat,
            perkhidmatan,
            inventoriAsal,
            inventoriDetails,
            totalBilangan,
            tarikhCadangan,
            jumlahBulan,
            jumlahCadangan,
            sebabPemotongan,
            sebabLainText,
            keputusanMesyuarat
        } = req.body;

        const request = new sql.Request();
        
        const query = `
            INSERT INTO pelarasan (
                nama_alamat, perkhidmatan, inventori_asal, inventori_details,
                total_bilangan, tarikh_cadangan, jumlah_bulan, jumlah_cadangan,
                sebab_pemotongan, sebab_lain_text, keputusan_mesyuarat,
                status, tarikh_daftar, created_at, updated_at
            ) 
            OUTPUT INSERTED.id
            VALUES (
                @namaAlamat, @perkhidmatan, @inventoriAsal, @inventoriDetails,
                @totalBilangan, @tarikhCadangan, @jumlahBulan, @jumlahCadangan,
                @sebabPemotongan, @sebabLainText, @keputusanMesyuarat,
                'Pending', GETDATE(), GETDATE(), GETDATE()
            )
        `;
        
        request.input('namaAlamat', sql.NVarChar, namaAlamat);
        request.input('perkhidmatan', sql.NVarChar, perkhidmatan);
        request.input('inventoriAsal', sql.NVarChar, inventoriAsal);
        request.input('inventoriDetails', sql.NVarChar, JSON.stringify(inventoriDetails));
        request.input('totalBilangan', sql.Decimal(10, 2), parseFloat(totalBilangan));
        request.input('tarikhCadangan', sql.Date, new Date(tarikhCadangan));
        request.input('jumlahBulan', sql.Int, parseInt(jumlahBulan));
        request.input('jumlahCadangan', sql.Decimal(10, 2), parseFloat(jumlahCadangan));
        request.input('sebabPemotongan', sql.NVarChar, sebabPemotongan);
        request.input('sebabLainText', sql.NVarChar, sebabLainText || null);
        request.input('keputusanMesyuarat', sql.NVarChar, keputusanMesyuarat);
        
        const result = await request.query(query);
        const insertedId = result.recordset[0].id;
        
        console.log('Pelarasan saved successfully. ID:', insertedId);
        res.json({ 
            success: true, 
            message: 'Pelarasan berjaya didaftarkan',
            data: { id: insertedId }
        });
        
    } catch (err) {
        console.error('Error saving pelarasan:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save pelarasan',
            error: err.message 
        });
    }
});

// API endpoint to get pelarasan data
app.get('/api/pelarasan/get', async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT 
                id, nama_alamat, perkhidmatan, inventori_asal, inventori_details,
                total_bilangan, tarikh_cadangan, jumlah_bulan, jumlah_cadangan,
                sebab_pemotongan, sebab_lain_text, keputusan_mesyuarat,
                status, tarikh_daftar, tarikh_selesai, created_at, updated_at
            FROM pelarasan
            WHERE 1=1
        `;
        
        const request = new sql.Request();
        
        if (status) {
            query += ` AND status = @status`;
            request.input('status', sql.NVarChar, status);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const result = await request.query(query);
        
        // Parse inventori_details JSON for each record
        const transformedData = result.recordset.map(row => ({
            ...row,
            inventori_details: row.inventori_details ? JSON.parse(row.inventori_details) : [],
            tarikh_cadangan: row.tarikh_cadangan ? row.tarikh_cadangan.toISOString().split('T')[0] : null,
            tarikh_daftar: row.tarikh_daftar ? row.tarikh_daftar.toLocaleDateString('ms-MY') : null,
            tarikh_selesai: row.tarikh_selesai ? row.tarikh_selesai.toLocaleDateString('ms-MY') : null
        }));
        
        res.json({
            success: true,
            data: transformedData
        });
        
    } catch (err) {
        console.error('Error fetching pelarasan data:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch data',
            error: err.message 
        });
    }
});

// API endpoint to update pelarasan
app.put('/api/pelarasan/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            namaAlamat,
            tarikhCadangan,
            jumlahBulan,
            jumlahCadangan,
            keputusanMesyuarat
        } = req.body;

        const request = new sql.Request();
        
        const query = `
            UPDATE pelarasan 
            SET 
                nama_alamat = @namaAlamat,
                tarikh_cadangan = @tarikhCadangan,
                jumlah_bulan = @jumlahBulan,
                jumlah_cadangan = @jumlahCadangan,
                keputusan_mesyuarat = @keputusanMesyuarat,
                updated_at = GETDATE()
            WHERE id = @id
        `;
        
        request.input('id', sql.Int, parseInt(id));
        request.input('namaAlamat', sql.NVarChar, namaAlamat);
        request.input('tarikhCadangan', sql.Date, new Date(tarikhCadangan));
        request.input('jumlahBulan', sql.Int, parseInt(jumlahBulan));
        request.input('jumlahCadangan', sql.Decimal(10, 2), parseFloat(jumlahCadangan));
        request.input('keputusanMesyuarat', sql.NVarChar, keputusanMesyuarat);
        
        await request.query(query);
        
        console.log('Pelarasan updated successfully. ID:', id);
        res.json({ 
            success: true, 
            message: 'Pelarasan berjaya dikemaskini'
        });
        
    } catch (err) {
        console.error('Error updating pelarasan:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update pelarasan',
            error: err.message 
        });
    }
});

// API endpoint to mark pelarasan as completed
app.put('/api/pelarasan/complete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const request = new sql.Request();
        
        const query = `
            UPDATE pelarasan 
            SET 
                status = 'Completed',
                tarikh_selesai = GETDATE(),
                updated_at = GETDATE()
            WHERE id = @id
        `;
        
        request.input('id', sql.Int, parseInt(id));
        
        await request.query(query);
        
        console.log('Pelarasan marked as completed. ID:', id);
        res.json({ 
            success: true, 
            message: 'Pelarasan telah ditandakan sebagai selesai'
        });
        
    } catch (err) {
        console.error('Error completing pelarasan:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to complete pelarasan',
            error: err.message 
        });
    }
});

// API endpoint to delete pelarasan
app.delete('/api/pelarasan/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const request = new sql.Request();
        
        const query = `DELETE FROM pelarasan WHERE id = @id`;
        
        request.input('id', sql.Int, parseInt(id));
        
        await request.query(query);
        
        console.log('Pelarasan deleted successfully. ID:', id);
        res.json({ 
            success: true, 
            message: 'Pelarasan berjaya dipadam'
        });
        
    } catch (err) {
        console.error('Error deleting pelarasan:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete pelarasan',
            error: err.message 
        });
    }
});

// API endpoint to get pelarasan statistics
app.get('/api/pelarasan/stats', async (req, res) => {
    try {
        const query = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(jumlah_cadangan) as total_amount
            FROM pelarasan 
            GROUP BY status
        `;
        
        const result = await sql.query(query);
        
        const stats = {
            pending: 0,
            completed: 0,
            total_pending_amount: 0,
            total_completed_amount: 0
        };
        
        result.recordset.forEach(row => {
            if (row.status === 'Pending') {
                stats.pending = row.count;
                stats.total_pending_amount = row.total_amount || 0;
            } else if (row.status === 'Completed') {
                stats.completed = row.count;
                stats.total_completed_amount = row.total_amount || 0;
            }
        });
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (err) {
        console.error('Error fetching pelarasan stats:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: err.message 
        });
    }
});

// API endpoint to check table structure (for debugging)
app.get('/api/pelarasan/table-info', async (req, res) => {
    try {
        const query = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'pelarasan'
            ORDER BY ORDINAL_POSITION
        `;
        
        const result = await sql.query(query);
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (err) {
        console.error('Error fetching table info:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch table info',
            error: err.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Pelarasan server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/pelarasan.html to view the application`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down pelarasan server...');
    try {
        await sql.close();
        console.log('Database connection closed.');
    } catch (err) {
        console.error('Error closing database connection:', err);
    }
    process.exit(0);
});