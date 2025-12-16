/**
 * transactionService.js
 * Service สำหรับรวมข้อมูลรายรับและรายจ่าย
 */

import { getAllExpenses, EXPENSE_CATEGORIES } from './expenseService';
import { getAllIncomes, INCOME_CATEGORIES } from './incomeService';

export const getAllTransactions = async () => {
    try {
        const [expenses, incomes] = await Promise.all([getAllExpenses(), getAllIncomes()]);

        const expenseTransactions = expenses.map(exp => ({
            ...exp, type: 'expense', categoryInfo: getCategoryInfo('expense', exp.category)
        }));

        const incomeTransactions = incomes.map(inc => ({
            ...inc, type: 'income', categoryInfo: getCategoryInfo('income', inc.category)
        }));

        const allTransactions = [...expenseTransactions, ...incomeTransactions];
        allTransactions.sort((a, b) => b.date - a.date);
        return allTransactions;
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        throw error;
    }
};

export const getCategoryInfo = (type, categoryId) => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const category = categories.find(c => c.id === categoryId);
    return category ? { label: category.label, icon: category.icon } : { label: categoryId, icon: '📋' };
};

export const getTransactionsByDateRange = async (startDate, endDate) => {
    const allTransactions = await getAllTransactions();
    return allTransactions.filter(t => t.date >= startDate && t.date <= endDate);
};

export const getSummaryByType = (transactions) => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
};

export const getMonthlyTransactions = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return getTransactionsByDateRange(startOfMonth.getTime(), endOfMonth.getTime());
};

export const getDashboardSummary = async () => {
    try {
        const [allTransactions, monthlyTransactions] = await Promise.all([
            getAllTransactions(), getMonthlyTransactions()
        ]);

        const allTimeSummary = getSummaryByType(allTransactions);
        const monthlySummary = getSummaryByType(monthlyTransactions);

        return {
            totalBalance: allTimeSummary.balance,
            totalIncome: allTimeSummary.totalIncome,
            totalExpense: allTimeSummary.totalExpense,
            monthlyIncome: monthlySummary.totalIncome,
            monthlyExpense: monthlySummary.totalExpense,
            monthlyBalance: monthlySummary.balance,
            totalTransactions: allTransactions.length,
            monthlyTransactionCount: monthlyTransactions.length
        };
    } catch (error) {
        console.error('Error getting dashboard summary:', error);
        throw error;
    }
};

export default { getAllTransactions, getCategoryInfo, getTransactionsByDateRange, getSummaryByType, getDashboardSummary, getMonthlyTransactions };
