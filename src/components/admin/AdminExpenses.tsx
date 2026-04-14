import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Expense, MealRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Plus, Trash2, TrendingUp, Calculator } from 'lucide-react';

export function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });

  useEffect(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setMeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord)));
    });

    return () => {
      unsubExpenses();
      unsubMeals();
    };
  }, []);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalMeals = meals.filter(m => m.status === 'ON').length;
  const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date
      });
      setNewExpense({ ...newExpense, title: '', amount: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Monthly Bazar</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Meals</CardTitle>
            <Calculator className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeals}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300 uppercase">Meal Rate</CardTitle>
            <Calculator className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{mealRate.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Bazar Cost System</CardTitle>
          <CardDescription>Track daily expenses to calculate meal rates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end p-4 bg-slate-50 rounded-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
              <Input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
              <Input value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} placeholder="e.g. Rice, Vegetables" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
              <Input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0.00" />
            </div>
            <Button onClick={addExpense} className="bg-slate-900 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Expense
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{format(parseISO(e.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="font-bold">₹{e.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(e.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
