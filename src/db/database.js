/**
 * database.js
 * ไฟล์จัดการการเชื่อมต่อฐานข้อมูล SQLite ด้วย expo-sqlite
 */

import * as SQLite from 'expo-sqlite';

let db = null;

export const getDatabase = () => {
    if (!db) {
        db = SQLite.openDatabaseSync('appdata.db');
    }
    return db;
};

export const initDb = async () => {
    const database = getDatabase();

    try {
        // สร้างตาราง receipts
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS receipts (
                id TEXT PRIMARY KEY NOT NULL,
                receipt_no TEXT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                customer_name TEXT,
                items TEXT,
                status TEXT DEFAULT 'pending',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `);

        // สร้างตาราง expenses
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY NOT NULL,
                amount REAL NOT NULL,
                date INTEGER NOT NULL,
                category TEXT NOT NULL,
                note TEXT,
                created_at INTEGER NOT NULL
            );
        `);

        // สร้างตาราง incomes
        await database.execAsync(`
            CREATE TABLE IF NOT EXISTS incomes (
                id TEXT PRIMARY KEY NOT NULL,
                amount REAL NOT NULL,
                date INTEGER NOT NULL,
                category TEXT NOT NULL,
                note TEXT,
                created_at INTEGER NOT NULL
            );
        `);

        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

export const executeQuery = async (sql, params = []) => {
    const database = getDatabase();

    try {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        if (isSelect) {
            const results = await database.getAllAsync(sql, params);
            return results;
        } else {
            const result = await database.runAsync(sql, params);
            return result;
        }
    } catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
};

export default { getDatabase, initDb, executeQuery };
