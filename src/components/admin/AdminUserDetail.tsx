import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { doc, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, MealRecord, Expense, Payment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';
import { ArrowLeft, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export function AdminUserDetail({ userId, onBack }: { userId: string, onBack: () => void }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allMeals, setAllMeals] = useState<MealRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [newPayment, setNewPayment] = useState({ type: 'meal', amount: '' });

  useEffect(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const unsubUser = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) setUser({ ...doc.data() } as UserProfile);
    });

    const unsubMeals = onSnapshot(query(collection(db, 'meals'), where('userId', '==', userId), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setMeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord)));
    });

    const unsubPayments = onSnapshot(query(collection(db, 'payments'), where('userId', '==', userId)), (snap) => {
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });

    const unsubAllMeals = onSnapshot(query(collection(db, 'meals'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setAllMeals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealRecord)));
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), where('date', '>=', startStr), where('date', '<=', endStr)), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return () => {
      unsubUser();
      unsubMeals();
      unsubPayments();
      unsubAllMeals();
      unsubExpenses();
    };
  }, [userId]);

  const totalGlobalMeals = allMeals.filter(m => m.status === 'ON').length;
  const totalGlobalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const mealRate = totalGlobalMeals > 0 ? totalGlobalExpense / totalGlobalMeals : 0;

  const userMealsCount = meals.filter(m => m.status === 'ON').length;
  const mealBill = userMealsCount * mealRate;
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  // Demo fixed costs
  const rent = 2000;
  const wifi = 200;
  const totalBill = mealBill + rent + wifi;
  const due = totalBill - totalPaid;

  const toggleMeal = async (meal: MealRecord) => {
    try {
      await updateDoc(doc(db, 'meals', meal.id), { status: meal.status === 'ON' ? 'OFF' : 'ON' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `meals/${meal.id}`);
    }
  };

  const addPayment = async () => {
    if (!newPayment.amount) return;
    try {
      await addDoc(collection(db, 'payments'), {
        userId,
        type: newPayment.type,
        amount: parseFloat(newPayment.amount),
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setNewPayment({ ...newPayment, amount: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payments');
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payments/${id}`);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info */}
        <Card className="border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>Room: {user.room || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold mb-3">Billing Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Meals ({userMealsCount})</span>
                  <span className="font-medium">₹{mealBill.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Rent</span>
                  <span className="font-medium">₹{rent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">WiFi</span>
                  <span className="font-medium">₹{wifi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100">
                  <span>Total Bill</span>
                  <span>₹{totalBill.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Paid</span>
                  <span>-₹{totalPaid.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-lg font-bold pt-2 ${due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>Due</span>
                  <span>₹{due.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Management */}
        <Card className="border-none shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Meal Status (This Month)</CardTitle>
            <CardDescription>Toggle meals ON/OFF for specific dates.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {meals.sort((a, b) => a.date.localeCompare(b.date)).map((meal) => (
                <Button
                  key={meal.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMeal(meal)}
                  className={`h-auto py-2 flex flex-col gap-1 ${meal.status === 'ON' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-50 text-slate-400'}`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-70">{format(parseISO(meal.date), 'MMM dd')}</span>
                  <span className="text-[10px] uppercase font-bold opacity-70">{meal.type}</span>
                  <span className="font-bold">{meal.status}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment System */}
        <Card className="border-none shadow-sm md:col-span-3">
          <CardHeader>
            <CardTitle>Payments & Transactions</CardTitle>
            <CardDescription>Record new payments and view history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end p-4 bg-slate-50 rounded-xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
                >
                  <option value="meal">Meal Bill</option>
                  <option value="rent">Room Rent</option>
                  <option value="wifi">WiFi Bill</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
                <Input 
                  type="number" 
                  value={newPayment.amount} 
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={addPayment} className="bg-slate-900 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Payment
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{format(parseISO(p.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="capitalize">{p.type}</TableCell>
                    <TableCell className="font-bold text-green-600">₹{p.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deletePayment(p.id)} className="text-red-500">
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
    </div>
  );
}
