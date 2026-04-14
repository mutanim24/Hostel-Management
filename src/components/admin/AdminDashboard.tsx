import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { UserProfile, MealRecord, Expense, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Utensils, CreditCard, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function AdminDashboard({ onUserClick }: { onUserClick: (userId: string) => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });

    const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setMeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord)));
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    const unsubPayments = onSnapshot(query(collection(db, 'payments'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });

    return () => {
      unsubUsers();
      unsubMeals();
      unsubExpenses();
      unsubPayments();
    };
  }, []);

  const totalMeals = meals.filter(m => m.status === 'ON').length;
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

  const getUserStats = (userId: string) => {
    const userMeals = meals.filter(m => m.userId === userId && m.status === 'ON').length;
    const userPayments = payments.filter(p => p.userId === userId).reduce((acc, p) => acc + p.amount, 0);
    const mealBill = userMeals * mealRate;
    // For demo, assume fixed rent 2000 and wifi 200
    const totalBill = mealBill + 2000 + 200;
    const due = totalBill - userPayments;
    return { userMeals, due };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Meals</CardTitle>
            <Utensils className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeals}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Total Bazar</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Meal Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{mealRate.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader>
          <CardTitle>Resident Directory</CardTitle>
          <CardDescription>Click a row to manage individual user billing and meals.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const { userMeals, due } = getUserStats(u.uid);
                return (
                  <TableRow 
                    key={u.uid} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => onUserClick(u.uid)}
                  >
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </TableCell>
                    <TableCell>{u.room || 'N/A'}</TableCell>
                    <TableCell>{userMeals}</TableCell>
                    <TableCell className={due > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      ₹{due.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={due <= 0 ? 'secondary' : 'outline'} className={due <= 0 ? 'bg-green-100 text-green-700' : ''}>
                        {due <= 0 ? 'Clear' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
